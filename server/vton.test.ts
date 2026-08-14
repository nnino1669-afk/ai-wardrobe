import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ENV } from "./_core/env";
import { resolveInferenceUrl } from "./storage";
import { describeClothType, mapClothType, requireInferenceUrl } from "./vton";

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
    expect(source).toContain('callCatVton(normalizedRequest)');
  });

  it("passes the selected model through the try-on router", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    expect(source).toContain('z.enum(["idmvton", "catvton"]).default("idmvton")');
    expect(source).toContain("model: input.model");
  });

  it("expands relative Manus storage paths into signed absolute URLs", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ url: "https://signed.example/person.png?token=test" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(resolveInferenceUrl("/manus-storage/input-images/1/person/photo.png"))
      .resolves.toBe("https://signed.example/person.png?token=test");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [request, options] = fetchMock.mock.calls[0];
    expect(String(request)).toContain("input-images");
    expect(options).toEqual(expect.objectContaining({ headers: expect.any(Object) }));
    fetchMock.mockRestore();
  });

  it("accepts absolute HTTP(S) URLs and rejects unsupported inference paths", () => {
    expect(requireInferenceUrl("https://example.com/person.png", "Person image URL")).toBe("https://example.com/person.png");
    expect(requireInferenceUrl("http://example.com/garment.png", "Garment image URL")).toBe("http://example.com/garment.png");
    expect(() => requireInferenceUrl("/manus-storage/person.png", "Person image URL")).toThrow("valid absolute HTTP(S) URL");
    expect(() => requireInferenceUrl("data:image/png;base64,abc", "Person image URL")).toThrow("valid absolute HTTP(S) URL");
  });

  it("maps every supported clothing category explicitly", () => {
    const categories = ["upper", "lower", "overall", "inner", "outer"] as const;
    const mapped = categories.map((category) => mapClothType(category));
    const descriptions = categories.map((category) => describeClothType(category));
    expect(mapped).toEqual(["upper_body", "lower_body", "dress", "inner", "upper_body"]);
    expect(descriptions.every((description) => description.length > 20)).toBe(true);
    expect(describeClothType("outer")).toContain("upper-body layer");
    expect(describeClothType("outer")).toContain("shoulders");
  });
});
