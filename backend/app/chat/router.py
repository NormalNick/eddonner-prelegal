"""POST /api/chat: drive Mutual NDA drafting via a freeform AI conversation.

A single structured-output call returns the assistant's reply plus a sparse
patch of NDA fields. The frontend deep-merges the patch into its form state.
"""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException, Request, status
from litellm import completion
from pydantic import BaseModel, Field

from ..auth.sessions import read_session

router = APIRouter(prefix="/chat", tags=["chat"])

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


class NdaPartyPatch(BaseModel):
    company: str | None = None
    printName: str | None = None
    title: str | None = None
    noticeAddress: str | None = None


class NdaFields(BaseModel):
    """Full NDA form snapshot the frontend sends with each turn."""

    purpose: str = ""
    effectiveDate: str = ""
    ndaTermKind: Literal["years", "untilTerminated"] = "years"
    ndaTermYears: int = 1
    confidentialityKind: Literal["years", "perpetuity"] = "years"
    confidentialityYears: int = 1
    governingLawState: str = ""
    jurisdiction: str = ""
    modifications: str = ""
    party1: NdaPartyPatch = Field(default_factory=NdaPartyPatch)
    party2: NdaPartyPatch = Field(default_factory=NdaPartyPatch)


class NdaFieldsPatch(BaseModel):
    """Sparse update returned by the model. Null fields are left untouched."""

    purpose: str | None = None
    effectiveDate: str | None = None
    ndaTermKind: Literal["years", "untilTerminated"] | None = None
    ndaTermYears: int | None = None
    confidentialityKind: Literal["years", "perpetuity"] | None = None
    confidentialityYears: int | None = None
    governingLawState: str | None = None
    jurisdiction: str | None = None
    modifications: str | None = None
    party1: NdaPartyPatch | None = None
    party2: NdaPartyPatch | None = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    currentFields: NdaFields


class ChatResponse(BaseModel):
    reply: str
    fieldsPatch: NdaFieldsPatch


SYSTEM_PROMPT = """You are a friendly assistant helping a user draft a Common Paper Mutual Non-Disclosure Agreement (MNDA) by chat.

Your job each turn:
1. Read the current field values and the conversation so far.
2. Reply in plain conversational English (2-4 sentences). Acknowledge anything you just captured, then ask the next question. Ask about ONE topic at a time.
3. Emit a `fieldsPatch` containing ONLY the fields the latest user message gave you new information for. Leave every other field as null. Never overwrite an existing value with null.

Fields to collect (collect roughly in this order, but adapt to what the user volunteers):
- purpose: one sentence describing why the parties are sharing confidential info.
- effectiveDate: ISO format YYYY-MM-DD. If the user says "today" use the current date from context.
- ndaTermKind ("years" or "untilTerminated") and, if "years", ndaTermYears (integer >= 1). Default suggestion: 1 year.
- confidentialityKind ("years" or "perpetuity") and, if "years", confidentialityYears (integer >= 1). Default suggestion: 1 year.
- governingLawState: a US state name, e.g. "Delaware".
- jurisdiction: city/county and state, e.g. "New Castle County, Delaware".
- modifications: any tweaks to the standard terms. If the user has none, set this to "" (empty string) so it renders as "None".
- party1 and party2: each has company, printName (signatory full name), title, noticeAddress (email or postal).

When all required fields are filled, congratulate the user and tell them they can review the preview on the right and click "Download PDF" to print or save.

Keep replies short. Do not lecture about legal matters. Do not invent values the user did not give you.
"""


def _build_messages(req: ChatRequest) -> list[dict]:
    system = (
        SYSTEM_PROMPT
        + "\n\nCurrent field values (JSON):\n"
        + req.currentFields.model_dump_json(indent=2)
    )
    msgs: list[dict] = [{"role": "system", "content": system}]
    for m in req.messages:
        msgs.append({"role": m.role, "content": m.content})
    return msgs


@router.post("", response_model=ChatResponse)
def chat(req: ChatRequest, request: Request) -> ChatResponse:
    if read_session(request) is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    response = completion(
        model=MODEL,
        messages=_build_messages(req),
        response_format=ChatResponse,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    raw = response.choices[0].message.content
    return ChatResponse.model_validate_json(raw)
