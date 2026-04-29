export type NdaTermKind = "years" | "untilTerminated";
export type ConfidentialityTermKind = "years" | "perpetuity";

export interface NdaParty {
  company: string;
  printName: string;
  title: string;
  noticeAddress: string;
}

export interface NdaFormData {
  purpose: string;
  effectiveDate: string;
  ndaTermKind: NdaTermKind;
  ndaTermYears: number;
  confidentialityKind: ConfidentialityTermKind;
  confidentialityYears: number;
  governingLawState: string;
  jurisdiction: string;
  modifications: string;
  party1: NdaParty;
  party2: NdaParty;
}

export type NdaPartyPatch = Partial<NdaParty>;

export interface NdaFieldsPatch {
  purpose?: string | null;
  effectiveDate?: string | null;
  ndaTermKind?: NdaTermKind | null;
  ndaTermYears?: number | null;
  confidentialityKind?: ConfidentialityTermKind | null;
  confidentialityYears?: number | null;
  governingLawState?: string | null;
  jurisdiction?: string | null;
  modifications?: string | null;
  party1?: NdaPartyPatch | null;
  party2?: NdaPartyPatch | null;
}
