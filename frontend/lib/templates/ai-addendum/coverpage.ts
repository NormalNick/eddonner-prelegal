import {
  NONE,
  escapeMarkdownBlock,
  fieldOrNone,
  fieldOrPlaceholder,
  formatEffectiveDate,
} from "../_shared";
import type { AiAddendumFormData } from "./types";

export function buildAiAddendumCoverPage(data: AiAddendumFormData): string {
  const customer = fieldOrPlaceholder(data.customer);
  const provider = fieldOrPlaceholder(data.provider);
  const effectiveDate = formatEffectiveDate(data.effectiveDate);
  const parentAgreement = fieldOrPlaceholder(data.parentAgreement);
  const trainingData = data.trainingData.trim()
    ? escapeMarkdownBlock(data.trainingData.trim())
    : NONE;
  const trainingPurposes = data.trainingPurposes.trim()
    ? escapeMarkdownBlock(data.trainingPurposes.trim())
    : NONE;
  const trainingRestrictions = fieldOrNone(data.trainingRestrictions);
  const improvementRestrictions = fieldOrNone(data.improvementRestrictions);

  return `# AI Addendum

## USING THIS AI ADDENDUM

This AI Addendum ("**AI Addendum**") supplements the Parent Agreement identified below and consists of: (1) this Cover Page ("**Cover Page**") and (2) the Common Paper AI Addendum Standard Terms Version 1.0 ("**Standard Terms**") identical to those posted at [commonpaper.com/standards/ai-addendum/1.0](https://commonpaper.com/standards/ai-addendum/1.0/). Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.

### Customer

${customer}

### Provider

${provider}

### Effective Date

${effectiveDate}

### Parent Agreement

${parentAgreement}

### Training Data

${trainingData}

### Training Purposes

${trainingPurposes}

### Training Restrictions

${trainingRestrictions}

### Improvement Restrictions

${improvementRestrictions}

By signing this Cover Page, each party agrees to enter into this AI Addendum as of the Effective Date.

|  | CUSTOMER | PROVIDER |
| :--- | :---: | :---: |
| Signature |  |  |
| Print Name |  |  |
| Title |  |  |
| Date |  |  |

Common Paper AI Addendum (Version 1.0) free to use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
`;
}
