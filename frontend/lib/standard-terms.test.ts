import { describe, it, expect } from "vitest";
import { STANDARD_TERMS_MARKDOWN } from "./standard-terms";

describe("STANDARD_TERMS_MARKDOWN — fidelity to Common Paper Mutual NDA v1.0", () => {
  it("starts with a 'Standard Terms' heading", () => {
    expect(STANDARD_TERMS_MARKDOWN.trimStart()).toMatch(/^# Standard Terms/);
  });

  it("contains all 11 numbered clauses in order", () => {
    const expected = [
      { num: 1, title: "Introduction" },
      { num: 2, title: "Use and Protection of Confidential Information" },
      { num: 3, title: "Exceptions" },
      { num: 4, title: "Disclosures Required by Law" },
      { num: 5, title: "Term and Termination" },
      { num: 6, title: "Return or Destruction of Confidential Information" },
      { num: 7, title: "Proprietary Rights" },
      { num: 8, title: "Disclaimer" },
      { num: 9, title: "Governing Law and Jurisdiction" },
      { num: 10, title: "Equitable Relief" },
      { num: 11, title: "General" },
    ];
    let lastIndex = -1;
    for (const { num, title } of expected) {
      const marker = `${num}. **${title}**`;
      const idx = STANDARD_TERMS_MARKDOWN.indexOf(marker);
      expect(idx, `missing or wrong marker: ${marker}`).toBeGreaterThan(-1);
      expect(idx, `clause ${num} out of order`).toBeGreaterThan(lastIndex);
      lastIndex = idx;
    }
  });

  it("ends with the Common Paper attribution and CC BY 4.0 link", () => {
    expect(STANDARD_TERMS_MARKDOWN).toContain(
      "Common Paper Mutual Non-Disclosure Agreement",
    );
    expect(STANDARD_TERMS_MARKDOWN).toContain(
      "https://commonpaper.com/standards/mutual-nda/1.0/",
    );
    expect(STANDARD_TERMS_MARKDOWN).toContain(
      "https://creativecommons.org/licenses/by/4.0/",
    );
  });

  it("preserves the AS IS disclaimer in all caps", () => {
    expect(STANDARD_TERMS_MARKDOWN).toContain(
      'ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS"',
    );
  });

  it("does not contain raw HTML span tags (they were intentionally converted to bold)", () => {
    expect(STANDARD_TERMS_MARKDOWN).not.toContain('<span class="coverpage_link">');
    expect(STANDARD_TERMS_MARKDOWN).not.toContain("</span>");
  });

  it("references the cover page fields by name as bold markers", () => {
    for (const field of [
      "**Purpose**",
      "**Effective Date**",
      "**MNDA Term**",
      "**Term of Confidentiality**",
      "**Governing Law**",
      "**Jurisdiction**",
    ]) {
      expect(STANDARD_TERMS_MARKDOWN).toContain(field);
    }
  });
});
