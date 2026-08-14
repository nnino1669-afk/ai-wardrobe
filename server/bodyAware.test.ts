import { describe, expect, it } from "vitest";
import { createFitProfile } from "./bodyAware";

describe("body-aware fit calibration", () => {
  it("preserves measurable image proportions and selected-region context", () => {
    expect(createFitProfile(1200, 1600)).toEqual({
      imageWidth: 1200,
      imageHeight: 1600,
      aspectRatio: 0.75,
      region: { x: 0, y: 0, width: 1, height: 1 },
      source: "full-frame",
    });
    expect(createFitProfile(800, 800, { x: 0.1, y: 0.2, width: 0.5, height: 0.6 }).source).toBe("selected-region");
  });

  it("rejects invalid dimensions and out-of-bounds regions", () => {
    expect(() => createFitProfile(0, 100)).toThrow("positive");
    expect(() => createFitProfile(100, 100, { x: 0.8, y: 0, width: 0.4, height: 1 })).toThrow("inside the image bounds");
  });
});
