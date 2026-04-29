import { buildCoverPage } from "./coverpage";
import { STANDARD_TERMS_MARKDOWN } from "./standard-terms";
import type { NdaFormData } from "./types";

export function buildFullNda(data: NdaFormData): string {
  return `${buildCoverPage(data)}\n---\n\n${STANDARD_TERMS_MARKDOWN}`;
}
