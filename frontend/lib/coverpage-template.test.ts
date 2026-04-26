import { describe, it, expect } from "vitest";
import { buildCoverPage } from "./coverpage-template";
import type { NdaFormData } from "./nda-types";

function fixture(overrides: Partial<NdaFormData> = {}): NdaFormData {
  return {
    purpose: "Evaluating a business relationship.",
    effectiveDate: "2026-04-26",
    ndaTermKind: "years",
    ndaTermYears: 1,
    confidentialityKind: "years",
    confidentialityYears: 1,
    governingLawState: "Delaware",
    jurisdiction: "New Castle, Delaware",
    modifications: "",
    party1: {
      company: "Acme Corp",
      printName: "Jane Doe",
      title: "CEO",
      noticeAddress: "jane@acme.example",
    },
    party2: {
      company: "Beta LLC",
      printName: "John Smith",
      title: "CTO",
      noticeAddress: "john@beta.example",
    },
    ...overrides,
  };
}

describe("buildCoverPage — pipe escaping in party fields (review issue #1)", () => {
  it("escapes pipes in company so the signature table stays intact", () => {
    const md = buildCoverPage(
      fixture({
        party1: { ...fixture().party1, company: "Acme | Holdings" },
      }),
    );
    expect(md).toContain("Acme \\| Holdings");
    expect(md).not.toContain("Acme | Holdings |");
  });

  it("escapes pipes in notice address", () => {
    const md = buildCoverPage(
      fixture({
        party2: {
          ...fixture().party2,
          noticeAddress: "123 Main St | Suite 400",
        },
      }),
    );
    expect(md).toContain("123 Main St \\| Suite 400");
  });

  it("does not introduce extra columns when a party field contains a pipe", () => {
    const md = buildCoverPage(
      fixture({
        party1: { ...fixture().party1, printName: "Jane | Doe" },
      }),
    );
    const printNameRow = md
      .split("\n")
      .find((line) => line.startsWith("| Print Name"));
    expect(printNameRow).toBeDefined();
    const cellSeparators = (printNameRow!.match(/(?<!\\)\|/g) ?? []).length;
    expect(cellSeparators).toBe(4);
  });
});

describe("buildCoverPage — markdown injection in free-text fields (review issue #2)", () => {
  it("escapes leading # in purpose so it doesn't render as a heading", () => {
    const md = buildCoverPage(fixture({ purpose: "# Confidential heading" }));
    expect(md).toContain("\\# Confidential heading");
  });

  it("escapes leading | in purpose", () => {
    const md = buildCoverPage(fixture({ purpose: "| not a table" }));
    expect(md).toContain("\\| not a table");
  });

  it("escapes leading > in purpose", () => {
    const md = buildCoverPage(fixture({ purpose: "> not a quote" }));
    expect(md).toContain("\\> not a quote");
  });

  it("escapes a lone --- line in purpose so it isn't rendered as a horizontal rule", () => {
    const md = buildCoverPage(fixture({ purpose: "before\n---\nafter" }));
    expect(md).toContain("\\---");
    expect(md).toContain("before");
    expect(md).toContain("after");
  });

  it("does not escape --- when followed by other text on the same line", () => {
    const md = buildCoverPage(fixture({ purpose: "--- some context" }));
    expect(md).toContain("--- some context");
    expect(md).not.toContain("\\--- some context");
  });

  it("escapes backticks anywhere in purpose", () => {
    const md = buildCoverPage(fixture({ purpose: "use `code` carefully" }));
    expect(md).toContain("use \\`code\\` carefully");
  });

  it("escapes block-level markers in modifications", () => {
    const md = buildCoverPage(
      fixture({ modifications: "## sneaky heading\n| sneaky table" }),
    );
    expect(md).toContain("\\## sneaky heading");
    expect(md).toContain("\\| sneaky table");
  });

  it("does not escape benign content", () => {
    const md = buildCoverPage(
      fixture({ purpose: "Plain prose with normal punctuation, parens (yes)." }),
    );
    expect(md).toContain("Plain prose with normal punctuation, parens (yes).");
    expect(md).not.toContain("\\");
  });
});

describe("buildCoverPage — year pluralization (review issue #6)", () => {
  it("renders '1 year' (singular) when MNDA term is 1", () => {
    const md = buildCoverPage(fixture({ ndaTermYears: 1 }));
    expect(md).toContain("Expires 1 year from Effective Date.");
  });

  it("renders '2 years' (plural) when MNDA term is 2", () => {
    const md = buildCoverPage(fixture({ ndaTermYears: 2 }));
    expect(md).toContain("Expires 2 years from Effective Date.");
  });

  it("renders '1 year' (singular) for confidentiality when years is 1", () => {
    const md = buildCoverPage(fixture({ confidentialityYears: 1 }));
    expect(md).toMatch(/- \[x] {5}1 year from Effective Date/);
  });

  it("renders '5 years' (plural) for confidentiality when years is 5", () => {
    const md = buildCoverPage(fixture({ confidentialityYears: 5 }));
    expect(md).toMatch(/- \[x] {5}5 years from Effective Date/);
  });
});

describe("buildCoverPage — date formatting", () => {
  it("formats ISO date as 'Month D, YYYY'", () => {
    const md = buildCoverPage(fixture({ effectiveDate: "2026-04-26" }));
    expect(md).toContain("April 26, 2026");
  });

  it("renders the placeholder when date is empty", () => {
    const md = buildCoverPage(fixture({ effectiveDate: "" }));
    expect(md).toMatch(/### Effective Date\n\n_____/);
  });

  it("does not shift dates due to local timezone", () => {
    const md = buildCoverPage(fixture({ effectiveDate: "2026-01-01" }));
    expect(md).toContain("January 1, 2026");
    expect(md).not.toContain("December 31, 2025");
  });
});

describe("buildCoverPage — placeholders for empty fields", () => {
  it("uses the placeholder for an empty governing law state", () => {
    const md = buildCoverPage(fixture({ governingLawState: "" }));
    expect(md).toContain("Governing Law: _____");
  });

  it("uses the placeholder for an empty jurisdiction", () => {
    const md = buildCoverPage(fixture({ jurisdiction: "" }));
    expect(md).toContain("Jurisdiction: _____");
  });

  it("uses the placeholder for empty party fields in the signature table", () => {
    const md = buildCoverPage(
      fixture({
        party1: { company: "", printName: "", title: "", noticeAddress: "" },
      }),
    );
    expect(md).toMatch(/\| Print Name \| _____ \|/);
    expect(md).toMatch(/\| Title \| _____ \|/);
    expect(md).toMatch(/\| Company \| _____ \|/);
    expect(md).toMatch(/\| Notice Address \| _____ \|/);
  });

  it("renders '_None._' when modifications is blank", () => {
    const md = buildCoverPage(fixture({ modifications: "" }));
    expect(md).toContain("### MNDA Modifications\n\n_None._");
  });
});

describe("buildCoverPage — radio group state reflected in checkboxes", () => {
  it("checks the 'years' option for MNDA term when ndaTermKind is 'years'", () => {
    const md = buildCoverPage(fixture({ ndaTermKind: "years", ndaTermYears: 3 }));
    expect(md).toContain("- [x]     Expires 3 years from Effective Date.");
    expect(md).toContain(
      "- [ ]     Continues until terminated in accordance with the terms of the MNDA.",
    );
  });

  it("checks 'until terminated' for MNDA term when ndaTermKind is 'untilTerminated'", () => {
    const md = buildCoverPage(fixture({ ndaTermKind: "untilTerminated" }));
    expect(md).toContain("- [ ]     Expires [N year(s)] from Effective Date.");
    expect(md).toContain(
      "- [x]     Continues until terminated in accordance with the terms of the MNDA.",
    );
  });

  it("checks 'years' option for confidentiality when confidentialityKind is 'years'", () => {
    const md = buildCoverPage(
      fixture({ confidentialityKind: "years", confidentialityYears: 7 }),
    );
    expect(md).toMatch(/- \[x] {5}7 years from Effective Date/);
    expect(md).toContain("- [ ]     In perpetuity.");
  });

  it("checks 'in perpetuity' for confidentiality when confidentialityKind is 'perpetuity'", () => {
    const md = buildCoverPage(fixture({ confidentialityKind: "perpetuity" }));
    expect(md).toContain("- [x]     In perpetuity.");
    expect(md).toMatch(/- \[ ] {5}\[N year\(s\)\] from Effective Date/);
  });
});

describe("buildCoverPage — document structure", () => {
  it("includes the canonical Common Paper attribution", () => {
    const md = buildCoverPage(fixture());
    expect(md).toContain(
      "Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under [CC BY 4.0]",
    );
  });

  it("includes all six top-level cover-page sections in order", () => {
    const md = buildCoverPage(fixture());
    const sections = [
      "### Purpose",
      "### Effective Date",
      "### MNDA Term",
      "### Term of Confidentiality",
      "### Governing Law & Jurisdiction",
      "### MNDA Modifications",
    ];
    let lastIndex = -1;
    for (const heading of sections) {
      const idx = md.indexOf(heading);
      expect(idx, `missing heading: ${heading}`).toBeGreaterThan(-1);
      expect(idx, `${heading} out of order`).toBeGreaterThan(lastIndex);
      lastIndex = idx;
    }
  });

  it("renders the signature table with all expected rows", () => {
    const md = buildCoverPage(fixture());
    for (const row of [
      "PARTY 1",
      "PARTY 2",
      "Signature",
      "Print Name",
      "Title",
      "Company",
      "Notice Address",
      "Date",
    ]) {
      expect(md).toContain(row);
    }
  });
});
