import { buildCoverPage } from "./coverpage-template";
import { STANDARD_TERMS_MARKDOWN } from "./standard-terms";
import type { NdaFormData } from "./nda-types";

export function buildFullNda(data: NdaFormData): string {
  return `${buildCoverPage(data)}\n---\n\n${STANDARD_TERMS_MARKDOWN}`;
}
