import type { NdaFormData, NdaParty } from "./nda-types";

const emptyParty: NdaParty = {
  company: "",
  printName: "",
  title: "",
  noticeAddress: "",
};

export function createDefaultFormData(): NdaFormData {
  const today = new Date().toISOString().slice(0, 10);
  return {
    purpose:
      "Evaluating whether to enter into a business relationship with the other party.",
    effectiveDate: today,
    ndaTermKind: "years",
    ndaTermYears: 1,
    confidentialityKind: "years",
    confidentialityYears: 1,
    governingLawState: "",
    jurisdiction: "",
    modifications: "",
    party1: { ...emptyParty },
    party2: { ...emptyParty },
  };
}
