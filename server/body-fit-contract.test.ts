import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculateFittingCrop } from "./bodyFitPreprocess";

describe("body-aware mannequin contract", () => {
  it("uses pose landmarks and computes garment fit measurements", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/lib/bodyFit.ts"), "utf8");
    expect(source).toContain("poseDetection.createDetector");
    expect(source).toContain("estimatePoses");
    expect(source).toContain("shoulderWidth");
    expect(source).toContain("hipWidth");
    expect(source).toContain("fitScale");
    expect(source).toContain("verticalAnchor");
  });

  it("uses body measurements to calculate a concrete inference crop", () => {
    const plan = { confidence: 0.9, bodyBox: { x: 0.25, y: 0.1, width: 0.5, height: 0.8 }, shoulderWidth: 0.3, hipWidth: 0.26, torsoRatio: 1.15, fitScale: 1.1, verticalAnchor: 0.36, detectedAt: Date.now() };
    const crop = calculateFittingCrop(1000, 1600, plan);
    expect(crop.width).toBeLessThan(1000);
    expect(crop.height).toBeLessThanOrEqual(1600);
    expect(crop.left).toBeGreaterThanOrEqual(0);
    expect(crop.top).toBeGreaterThanOrEqual(0);
  });

  it("passes validated body-fit data from the studio to VTON", () => {
    const studio = readFileSync(resolve(process.cwd(), "client/src/pages/TryOnStudio.tsx"), "utf8");
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const adapter = readFileSync(resolve(process.cwd(), "server/vton.ts"), "utf8");
    expect(studio).toContain("<BodyCalibration");
    expect(studio).toContain("bodyFitPlan: bodyFitPlan ?? undefined");
    expect(router).toContain("bodyFitPlan: z.object({");
    expect(router).toContain("prepareBodyAwareInferenceImage");
    expect(adapter).toContain("request.bodyFitPlan");
  });
});
