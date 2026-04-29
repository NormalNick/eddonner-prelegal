import { buildAiAddendumCoverPage } from "./coverpage";
import { STANDARD_TERMS_MARKDOWN } from "./standard-terms";
import type { AiAddendumFormData } from "./types";

export function buildFullAiAddendum(data: AiAddendumFormData): string {
  return `${buildAiAddendumCoverPage(data)}\n---\n\n${STANDARD_TERMS_MARKDOWN}`;
}
