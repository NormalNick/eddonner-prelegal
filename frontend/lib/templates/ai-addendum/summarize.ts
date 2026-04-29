import type { AiAddendumFormData } from "./types";

const MAX_LEN = 80;

export function summarize(data: AiAddendumFormData): string {
  const customer = data.customer.trim();
  const provider = data.provider.trim();
  if (customer && provider)
    return clamp(`AI Addendum: ${customer} ↔ ${provider}`);
  if (customer || provider)
    return clamp(`AI Addendum with ${customer || provider}`);

  const parent = data.parentAgreement.trim();
  if (parent) return clamp(`AI Addendum: ${parent}`);

  return "AI Addendum draft";
}

function clamp(text: string): string {
  if (text.length <= MAX_LEN) return text;
  return text.slice(0, MAX_LEN - 1).trimEnd() + "…";
}
