import type { NdaFieldsPatch, NdaFormData, NdaParty } from "./types";

function applyPartyPatch(current: NdaParty, patch: Partial<NdaParty>): NdaParty {
  const next: NdaParty = { ...current };
  for (const [key, value] of Object.entries(patch) as [keyof NdaParty, unknown][]) {
    if (value === null || value === undefined) continue;
    next[key] = String(value);
  }
  return next;
}

export function applyPatch(current: NdaFormData, patch: NdaFieldsPatch): NdaFormData {
  const next: NdaFormData = {
    ...current,
    party1: { ...current.party1 },
    party2: { ...current.party2 },
  };
  for (const [key, value] of Object.entries(patch) as [keyof NdaFieldsPatch, unknown][]) {
    if (value === null || value === undefined) continue;
    if (key === "party1" || key === "party2") {
      next[key] = applyPartyPatch(current[key], value as Partial<NdaParty>);
    } else {
      (next as unknown as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}
