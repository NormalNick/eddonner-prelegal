import { describe, it, expect } from "vitest";
import { buildFullNda } from "./builder";
import { createDefaultFormData } from "./defaults";

describe("buildFullNda", () => {
  it("includes the cover page heading", () => {
    const md = buildFullNda(createDefaultFormData());
    expect(md).toContain("# Mutual Non-Disclosure Agreement");
  });

  it("includes the standard terms heading after the cover page", () => {
    const md = buildFullNda(createDefaultFormData());
    const coverIdx = md.indexOf("# Mutual Non-Disclosure Agreement");
    const termsIdx = md.indexOf("# Standard Terms");
    expect(coverIdx).toBeGreaterThan(-1);
    expect(termsIdx).toBeGreaterThan(coverIdx);
  });

  it("inserts a horizontal rule between cover page and standard terms (page break)", () => {
    const md = buildFullNda(createDefaultFormData());
    const coverEnd = md.indexOf("# Standard Terms");
    const before = md.slice(0, coverEnd);
    expect(before).toMatch(/\n---\n\n$/);
  });
});

describe("createDefaultFormData", () => {
  it("returns a usable default with today's date in ISO format", () => {
    const data = createDefaultFormData();
    expect(data.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("has independent party objects (not shared references)", () => {
    const data = createDefaultFormData();
    data.party1.company = "mutated";
    expect(data.party2.company).toBe("");
  });

  it("starts with the canonical default purpose", () => {
    const data = createDefaultFormData();
    expect(data.purpose).toBe(
      "Evaluating whether to enter into a business relationship with the other party.",
    );
  });

  it("defaults to 1-year MNDA term and 1-year confidentiality term", () => {
    const data = createDefaultFormData();
    expect(data.ndaTermKind).toBe("years");
    expect(data.ndaTermYears).toBe(1);
    expect(data.confidentialityKind).toBe("years");
    expect(data.confidentialityYears).toBe(1);
  });
});
