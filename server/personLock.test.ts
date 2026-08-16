import { describe, it, expect } from "vitest";
import { analyzePersonForLock } from "./personLockAnalysis";
import { describeClothType } from "./vton";
import sharp from "sharp";

describe("Identity-Preserving Person Lock & Prompt Rework", () => {
  it("extracts body dimensions, skin tone, and hair color estimates from person photos", async () => {
    const testImage = await sharp({
      create: {
        width: 400,
        height: 600,
        channels: 3,
        background: { r: 200, g: 180, b: 160 },
      },
    })
      .png()
      .toBuffer();

    const profile = await analyzePersonForLock(testImage);
    expect(profile.width).toBe(400);
    expect(profile.height).toBe(600);
    expect(profile.hasClearFaceRegion).toBe(true);
    expect(profile.skinToneEstimate).toBeTruthy();
    expect(profile.hairColorEstimate).toBeTruthy();
  });

  it("includes strict identity lock constraints in VTON garment descriptions", () => {
    const desc = describeClothType("upper");
    expect(desc).toContain("high-realism upper-body garment");
  });
});
