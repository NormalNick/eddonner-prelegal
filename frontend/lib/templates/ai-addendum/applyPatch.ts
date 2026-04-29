import type { AiAddendumFieldsPatch, AiAddendumFormData } from "./types";

export function applyPatch(
  current: AiAddendumFormData,
  patch: AiAddendumFieldsPatch,
): AiAddendumFormData {
  const next: AiAddendumFormData = { ...current };
  for (const [key, value] of Object.entries(patch) as [
    keyof AiAddendumFieldsPatch,
    unknown,
  ][]) {
    if (value === null || value === undefined) continue;
    (next as unknown as Record<string, unknown>)[key] = String(value);
  }
  return next;
}
