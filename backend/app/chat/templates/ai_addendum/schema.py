"""AI Addendum structured-output schema."""

from __future__ import annotations

from pydantic import BaseModel


class AiAddendumFields(BaseModel):
    """Full AI Addendum form snapshot the frontend sends with each turn."""

    customer: str = ""
    provider: str = ""
    effectiveDate: str = ""
    parentAgreement: str = ""
    trainingData: str = ""
    trainingPurposes: str = ""
    trainingRestrictions: str = ""
    improvementRestrictions: str = ""


class AiAddendumFieldsPatch(BaseModel):
    """Sparse update returned by the model. Null fields are left untouched."""

    customer: str | None = None
    provider: str | None = None
    effectiveDate: str | None = None
    parentAgreement: str | None = None
    trainingData: str | None = None
    trainingPurposes: str | None = None
    trainingRestrictions: str | None = None
    improvementRestrictions: str | None = None
