import type { NdaFormData } from "./types";

const MAX_LEN = 80;

export function summarize(data: NdaFormData): string {
  const a = data.party1.company.trim();
  const b = data.party2.company.trim();
  if (a && b) return clamp(`NDA: ${a} ↔ ${b}`);
  if (a || b) return clamp(`NDA with ${a || b}`);

  const purpose = data.purpose.trim();
  if (purpose) return clamp(`NDA: ${purpose}`);

  return "Mutual NDA draft";
}

function clamp(text: string): string {
  if (text.length <= MAX_LEN) return text;
  return text.slice(0, MAX_LEN - 1).trimEnd() + "…";
}
