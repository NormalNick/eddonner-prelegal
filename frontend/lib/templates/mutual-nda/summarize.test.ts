import { describe, expect, it } from "vitest";
import { createDefaultFormData } from "./defaults";
import { summarize } from "./summarize";

describe("mutual-nda summarize", () => {
  it("returns a fallback when no fields are filled in", () => {
    const data = { ...createDefaultFormData(), purpose: "" };
    expect(summarize(data)).toBe("Mutual NDA draft");
  });

  it("uses both party names when both are present", () => {
    const data = createDefaultFormData();
    data.party1.company = "Acme Inc";
    data.party2.company = "Globex Corp";
    expect(summarize(data)).toBe("NDA: Acme Inc ↔ Globex Corp");
  });

  it("uses one party name when only one is provided", () => {
    const data = createDefaultFormData();
    data.party1.company = "Acme Inc";
    expect(summarize(data)).toBe("NDA with Acme Inc");
  });

  it("falls back to the purpose when no party is named", () => {
    const data = createDefaultFormData();
    data.purpose = "Evaluating an acquisition.";
    expect(summarize(data)).toBe("NDA: Evaluating an acquisition.");
  });

  it("clamps very long titles to 80 chars", () => {
    const data = createDefaultFormData();
    data.party1.company = "A".repeat(200);
    const summary = summarize(data);
    expect(summary.length).toBeLessThanOrEqual(80);
    expect(summary.endsWith("…")).toBe(true);
  });
});
