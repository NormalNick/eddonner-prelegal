import type { AiAddendumFormData } from "./types";

export function createDefaultAiAddendumData(): AiAddendumFormData {
  const today = new Date().toISOString().slice(0, 10);
  return {
    customer: "",
    provider: "",
    effectiveDate: today,
    parentAgreement: "",
    trainingData: "",
    trainingPurposes: "",
    trainingRestrictions: "",
    improvementRestrictions: "",
  };
}
