import { describe, expect, it } from "vitest";
import { createDefaultAiAddendumData } from "./defaults";
import { summarize } from "./summarize";

describe("ai-addendum summarize", () => {
  it("returns a fallback when no fields are filled in", () => {
    expect(summarize(createDefaultAiAddendumData())).toBe(
      "AI Addendum draft",
    );
  });

  it("uses customer + provider when both are present", () => {
    const data = createDefaultAiAddendumData();
    data.customer = "Acme Inc";
    data.provider = "Globex Corp";
    expect(summarize(data)).toBe(
      "AI Addendum: Acme Inc ↔ Globex Corp",
    );
  });

  it("falls back to the parent agreement when only it is set", () => {
    const data = createDefaultAiAddendumData();
    data.parentAgreement = "MSA dated 2025-01-01";
    expect(summarize(data)).toBe(
      "AI Addendum: MSA dated 2025-01-01",
    );
  });
});
