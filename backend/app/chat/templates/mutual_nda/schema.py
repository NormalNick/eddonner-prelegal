"""Mutual NDA structured-output schema. Mirrored on the frontend in
`frontend/lib/templates/mutual-nda/types.ts`."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


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
