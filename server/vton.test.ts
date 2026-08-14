import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ENV } from "./_core/env";
import { describeClothType, mapClothType } from "./vton";

describe("Hugging Face Virtual Try-On Integration", () => {
  it("has Hugging Face API token configured", () => {
    expect(ENV.huggingFaceApiToken).toBeTruthy();
    expect(ENV.huggingFaceApiToken.length).toBeGreaterThan(0);
    expect(ENV.huggingFaceApiToken.startsWith("hf_")).toBe(true);
  });

  it("keeps the documented IDM-VTON Gradio endpoint and both model adapters", () => {
    const source = readFileSync(resolve(process.cwd(), "server/vton.ts"), "utf8");
    expect(source).toContain('const IDM_VTON_SPACE = "yisol/IDM-VTON";');
    expect(source).toContain("Client.connect(");
    expect(source).toContain('app.predict("/tryon"');
    expect(source).toContain('model === MODELS.idmvton');
    expect(source).toContain('callCatVton(request)');
  });

  it("passes the selected model through the try-on router", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    expect(source).toContain('z.enum(["idmvton", "catvton"]).default("idmvton")');
    expect(source).toContain("model: input.model");
  });

  it("maps every supported clothing category explicitly", () => {
    const categories = ["upper", "lower", "overall", "inner", "outer"] as const;
    const mapped = categories.map((category) => mapClothType(category));
    const descriptions = categories.map((category) => describeClothType(category));
    expect(mapped).toEqual(["upper_body", "lower_body", "dress", "inner", "outer"]);
    expect(descriptions.every((description) => description.length > 20)).toBe(true);
  });
});
