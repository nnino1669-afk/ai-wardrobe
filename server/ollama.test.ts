import { describe, it, expect } from "vitest";
import { generateOllamaResponse } from "./ollama";

describe("Ollama Local LLM Integration", () => {
  it("should be defined and handle unreachable endpoints gracefully", async () => {
    expect(generateOllamaResponse).toBeDefined();
    await expect(
      generateOllamaResponse("Hello test", { baseUrl: "http://localhost:9999" })
    ).rejects.toThrow();
  });
});
