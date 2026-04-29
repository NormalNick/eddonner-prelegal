"""Slug -> TemplateConfig registry. Driven by `catalog.json`. Supported
templates own a Pydantic schema + system prompt; unsupported templates
carry a `nearest_slug` so the picker / chat can suggest an alternative."""

from __future__ import annotations

from dataclasses import dataclass

from pydantic import BaseModel

from .ai_addendum.prompt import SYSTEM_PROMPT as AI_ADDENDUM_PROMPT
from .ai_addendum.schema import AiAddendumFields, AiAddendumFieldsPatch
from .mutual_nda.prompt import SYSTEM_PROMPT as MUTUAL_NDA_PROMPT
from .mutual_nda.schema import NdaFields, NdaFieldsPatch


@dataclass(frozen=True)
class TemplateConfig:
    slug: str
    display_name: str
    supported: bool
    fields_type: type[BaseModel] | None = None
    patch_type: type[BaseModel] | None = None
    system_prompt: str | None = None
    nearest_slug: str | None = None


_CONFIGS: list[TemplateConfig] = [
    TemplateConfig(
        slug="mutual-nda",
        display_name="Mutual NDA",
        supported=True,
        fields_type=NdaFields,
        patch_type=NdaFieldsPatch,
        system_prompt=MUTUAL_NDA_PROMPT,
    ),
    TemplateConfig(
        slug="ai-addendum",
        display_name="AI Addendum",
        supported=True,
        fields_type=AiAddendumFields,
        patch_type=AiAddendumFieldsPatch,
        system_prompt=AI_ADDENDUM_PROMPT,
    ),
    # Unsupported entries: picker shows them but routes through `_suggest_response`.
    # `nearest_slug` is the supported template we point users toward.
    TemplateConfig(
        slug="csa",
        display_name="Cloud Service Agreement",
        supported=False,
        nearest_slug="mutual-nda",
    ),
    TemplateConfig(
        slug="design-partner-agreement",
        display_name="Design Partner Agreement",
        supported=False,
        nearest_slug="mutual-nda",
    ),
    TemplateConfig(
        slug="sla",
        display_name="Service Level Agreement",
        supported=False,
        nearest_slug="mutual-nda",
    ),
    TemplateConfig(
        slug="psa",
        display_name="Professional Services Agreement",
        supported=False,
        nearest_slug="mutual-nda",
    ),
    TemplateConfig(
        slug="dpa",
        display_name="Data Processing Agreement",
        supported=False,
        nearest_slug="mutual-nda",
    ),
    TemplateConfig(
        slug="software-license-agreement",
        display_name="Software License Agreement",
        supported=False,
        nearest_slug="mutual-nda",
    ),
    TemplateConfig(
        slug="partnership-agreement",
        display_name="Partnership Agreement",
        supported=False,
        nearest_slug="mutual-nda",
    ),
    TemplateConfig(
        slug="pilot-agreement",
        display_name="Pilot Agreement",
        supported=False,
        nearest_slug="mutual-nda",
    ),
    TemplateConfig(
        slug="baa",
        display_name="Business Associate Agreement",
        supported=False,
        nearest_slug="mutual-nda",
    ),
]

REGISTRY: dict[str, TemplateConfig] = {c.slug: c for c in _CONFIGS}


def get(slug: str) -> TemplateConfig | None:
    return REGISTRY.get(slug)
