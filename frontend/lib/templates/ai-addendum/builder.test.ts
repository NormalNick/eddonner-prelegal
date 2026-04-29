import { describe, it, expect } from "vitest";
import { applyPatch } from "./applyPatch";
import { buildFullAiAddendum } from "./builder";
import { createDefaultAiAddendumData } from "./defaults";

describe("buildFullAiAddendum", () => {
  it("includes the AI Addendum heading and the Common Paper standard terms heading", () => {
    const md = buildFullAiAddendum(createDefaultAiAddendumData());
    expect(md).toContain("# AI Addendum");
    // The generated standard-terms.ts begins with "# AI Addendum" too, so
    // assert the cover-page sections are present in order.
    expect(md.indexOf("### Customer")).toBeGreaterThan(md.indexOf("# AI Addendum"));
    expect(md.indexOf("### Provider")).toBeGreaterThan(md.indexOf("### Customer"));
    expect(md.indexOf("### Training Data")).toBeGreaterThan(md.indexOf("### Provider"));
  });

  it("uses the placeholder for empty fields", () => {
    const md = buildFullAiAddendum(createDefaultAiAddendumData());
    expect(md).toMatch(/### Customer\n\n_____/);
    expect(md).toMatch(/### Provider\n\n_____/);
    // Training fields default to "_None._" since empty means "no training permitted".
    expect(md).toMatch(/### Training Data\n\n_None._/);
    expect(md).toMatch(/### Training Purposes\n\n_None._/);
  });

  it("renders filled fields", () => {
    const md = buildFullAiAddendum({
      customer: "Acme Corp",
      provider: "Beta LLC",
      effectiveDate: "2026-04-26",
      parentAgreement: "CSA dated 2025-06-01",
      trainingData: "Deidentified inputs",
      trainingPurposes: "Improving the AI System",
      trainingRestrictions: "No Personal Data",
      improvementRestrictions: "No human review",
    });
    expect(md).toContain("Acme Corp");
    expect(md).toContain("Beta LLC");
    expect(md).toContain("April 26, 2026");
    expect(md).toContain("CSA dated 2025-06-01");
    expect(md).toContain("Deidentified inputs");
    expect(md).toContain("Improving the AI System");
    expect(md).toContain("No Personal Data");
    expect(md).toContain("No human review");
  });
});

describe("AI Addendum applyPatch", () => {
  it("merges only non-null fields and leaves others unchanged", () => {
    const before = createDefaultAiAddendumData();
    before.customer = "Existing Customer";
    const after = applyPatch(before, {
      provider: "New Provider",
      customer: null,
      trainingData: "OK",
    });
    expect(after.provider).toBe("New Provider");
    expect(after.trainingData).toBe("OK");
    expect(after.customer).toBe("Existing Customer");
  });

  it("does not mutate the input object", () => {
    const before = createDefaultAiAddendumData();
    applyPatch(before, { customer: "Changed" });
    expect(before.customer).toBe("");
  });
});
