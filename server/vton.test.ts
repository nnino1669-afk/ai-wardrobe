import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

describe("Hugging Face Virtual Try-On Integration", () => {
  it("has Hugging Face API token configured", () => {
    // Verify that the API token is set in environment
    expect(ENV.huggingFaceApiToken).toBeTruthy();
    expect(ENV.huggingFaceApiToken.length).toBeGreaterThan(0);
    // Token should start with 'hf_' for Hugging Face tokens
    expect(ENV.huggingFaceApiToken.startsWith("hf_")).toBe(true);
  });
});
