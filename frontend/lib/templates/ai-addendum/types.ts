export interface AiAddendumFormData {
  customer: string;
  provider: string;
  effectiveDate: string;
  parentAgreement: string;
  trainingData: string;
  trainingPurposes: string;
  trainingRestrictions: string;
  improvementRestrictions: string;
}

export interface AiAddendumFieldsPatch {
  customer?: string | null;
  provider?: string | null;
  effectiveDate?: string | null;
  parentAgreement?: string | null;
  trainingData?: string | null;
  trainingPurposes?: string | null;
  trainingRestrictions?: string | null;
  improvementRestrictions?: string | null;
}
