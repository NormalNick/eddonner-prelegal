import {
  escapeMarkdownBlock,
  fieldOrPlaceholder,
  formatEffectiveDate,
} from "../_shared";
import type { NdaFormData, NdaParty } from "./types";

function pluralYears(n: number): string {
  return `${n} year${n === 1 ? "" : "s"}`;
}

function ndaTermLines(data: NdaFormData): string {
  if (data.ndaTermKind === "years") {
    return [
      `- [x]     Expires ${pluralYears(data.ndaTermYears)} from Effective Date.`,
      "- [ ]     Continues until terminated in accordance with the terms of the MNDA.",
    ].join("\n");
  }
  return [
    "- [ ]     Expires [N year(s)] from Effective Date.",
    "- [x]     Continues until terminated in accordance with the terms of the MNDA.",
  ].join("\n");
}

function confidentialityLines(data: NdaFormData): string {
  if (data.confidentialityKind === "years") {
    return [
      `- [x]     ${pluralYears(data.confidentialityYears)} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`,
      "- [ ]     In perpetuity.",
    ].join("\n");
  }
  return [
    "- [ ]     [N year(s)] from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.",
    "- [x]     In perpetuity.",
  ].join("\n");
}

function partyCell(party: NdaParty, key: keyof NdaParty): string {
  return fieldOrPlaceholder(party[key])
    .replace(/\n/g, " ")
    .replace(/\|/g, "\\|");
}

function signatureTable(data: NdaFormData): string {
  const rows = [
    ["", "PARTY 1", "PARTY 2"],
    ["---", ":---:", ":---:"],
    ["Signature", "", ""],
    ["Print Name", partyCell(data.party1, "printName"), partyCell(data.party2, "printName")],
    ["Title", partyCell(data.party1, "title"), partyCell(data.party2, "title")],
    ["Company", partyCell(data.party1, "company"), partyCell(data.party2, "company")],
    [
      "Notice Address",
      partyCell(data.party1, "noticeAddress"),
      partyCell(data.party2, "noticeAddress"),
    ],
    ["Date", "", ""],
  ];
  return rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
}

export function buildCoverPage(data: NdaFormData): string {
  const purpose = escapeMarkdownBlock(fieldOrPlaceholder(data.purpose));
  const effectiveDate = formatEffectiveDate(data.effectiveDate);
  const governingLaw = fieldOrPlaceholder(data.governingLawState);
  const jurisdiction = fieldOrPlaceholder(data.jurisdiction);
  const modifications = data.modifications.trim()
    ? escapeMarkdownBlock(data.modifications.trim())
    : "_None._";

  return `# Mutual Non-Disclosure Agreement

## USING THIS MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement (the "MNDA") consists of: (1) this Cover Page ("**Cover Page**") and (2) the Common Paper Mutual NDA Standard Terms Version 1.0 ("**Standard Terms**") identical to those posted at [commonpaper.com/standards/mutual-nda/1.0](https://commonpaper.com/standards/mutual-nda/1.0). Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.

### Purpose

${purpose}

### Effective Date

${effectiveDate}

### MNDA Term

${ndaTermLines(data)}

### Term of Confidentiality

${confidentialityLines(data)}

### Governing Law & Jurisdiction

Governing Law: ${governingLaw}

Jurisdiction: ${jurisdiction}

### MNDA Modifications

${modifications}

By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.

${signatureTable(data)}

Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
`;
}
