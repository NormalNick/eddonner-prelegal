"""POST /api/chat: drive multi-template document drafting via AI conversation.

Each request carries a `templateSlug`. The router dispatches to the
template's Pydantic schema + system prompt, calls LiteLLM with a
structured-output schema specific to that template, and returns a
deep-mergeable sparse `fieldsPatch`.

Unsupported slugs (or in-chat user requests for unsupported templates)
short-circuit to `mode: "suggest"` with the nearest supported template.
"""

from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Request, status
from litellm import completion
from litellm.exceptions import APIError, AuthenticationError, RateLimitError
from pydantic import BaseModel, create_model

from ..auth.sessions import read_session
from .templates import registry

router = APIRouter(prefix="/chat", tags=["chat"])

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    templateSlug: str
    messages: list[ChatMessage]
    currentFields: dict[str, Any]


class ChatResponse(BaseModel):
    mode: Literal["draft", "suggest"]
    reply: str
    fieldsPatch: dict[str, Any] | None = None
    suggestedSlug: str | None = None


def _build_messages(
    config: registry.TemplateConfig,
    fields: BaseModel,
    history: list[ChatMessage],
) -> list[dict[str, str]]:
    system = (
        (config.system_prompt or "")
        + "\n\nCurrent field values (JSON):\n"
        + fields.model_dump_json(indent=2)
    )
    msgs: list[dict[str, str]] = [{"role": "system", "content": system}]
    for m in history:
        msgs.append({"role": m.role, "content": m.content})
    return msgs


_RESPONSE_MODELS: dict[str, type[BaseModel]] = {}


def _response_model_for(slug: str, patch_type: type[BaseModel]) -> type[BaseModel]:
    """One Pydantic response model per slug, built lazily and cached.
    `patch_type` is a real runtime type here (not a forward-reference
    string), so `create_model` resolves the field cleanly even with
    `from __future__ import annotations` on the module."""
    cached = _RESPONSE_MODELS.get(slug)
    if cached is not None:
        return cached
    model = create_model(
        f"ChatResponse_{slug}",
        mode=(Literal["draft", "suggest"], ...),
        reply=(str, ...),
        fieldsPatch=(patch_type | None, None),
        suggestedSlug=(str | None, None),
    )
    _RESPONSE_MODELS[slug] = model
    return model


def _suggest_response(slug: str) -> ChatResponse:
    config = registry.get(slug)
    if config is None:
        return ChatResponse(
            mode="suggest",
            reply=(
                f"I don't recognize the template '{slug}'. "
                "The Mutual NDA is the closest available template."
            ),
            suggestedSlug="mutual-nda",
        )
    nearest = registry.get(config.nearest_slug or "mutual-nda")
    nearest_name = nearest.display_name if nearest else "Mutual NDA"
    nearest_slug = nearest.slug if nearest else "mutual-nda"
    return ChatResponse(
        mode="suggest",
        reply=(
            f"AI drafting for the {config.display_name} isn't available yet. "
            f"The closest template I can draft right now is the {nearest_name}. "
            "Would you like to start there?"
        ),
        suggestedSlug=nearest_slug,
    )


@router.post("", response_model=ChatResponse)
def chat(req: ChatRequest, request: Request) -> ChatResponse:
    if read_session(request) is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    config = registry.get(req.templateSlug)
    if config is None or not config.supported:
        return _suggest_response(req.templateSlug)

    fields = config.fields_type.model_validate(req.currentFields)
    response_model = _response_model_for(config.slug, config.patch_type)

    try:
        response = completion(
            model=MODEL,
            messages=_build_messages(config, fields, req.messages),
            response_format=response_model,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
        )
    except AuthenticationError as exc:
        # Almost always an invalid/expired OPENROUTER_API_KEY in .env.
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "The AI provider rejected our credentials. "
                "Check OPENROUTER_API_KEY in .env."
            ),
        ) from exc
    except RateLimitError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="The AI provider is rate-limiting requests. Try again in a moment.",
        ) from exc
    except APIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"The AI provider returned an error: {exc!s}",
        ) from exc

    raw = response.choices[0].message.content
    parsed = response_model.model_validate_json(raw)
    return ChatResponse(**parsed.model_dump())
