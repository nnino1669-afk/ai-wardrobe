import sharp from "sharp";
import { storageGetSignedUrl, storagePut } from "./storage";

export type BodyFitPlan = {
  confidence: number;
  bodyBox: { x: number; y: number; width: number; height: number };
  shoulderWidth: number;
  hipWidth: number;
  torsoRatio: number;
  fitScale: number;
  verticalAnchor: number;
  detectedAt: number;
};

export function calculateFittingCrop(imageWidth: number, imageHeight: number, plan: BodyFitPlan) {
  const fitScale = Math.min(1.15, Math.max(0.85, plan.fitScale));
  const marginX = 0.12 / fitScale;
  const marginY = 0.1 / fitScale;
  const left = Math.max(0, Math.floor((plan.bodyBox.x - marginX) * imageWidth));
  const top = Math.max(0, Math.floor((plan.bodyBox.y - marginY) * imageHeight));
  const right = Math.min(imageWidth, Math.ceil((plan.bodyBox.x + plan.bodyBox.width + marginX) * imageWidth));
  const bottom = Math.min(imageHeight, Math.ceil((plan.bodyBox.y + plan.bodyBox.height + marginY) * imageHeight));
  return { left, top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

export async function prepareBodyAwareInferenceImage(imageUrl: string, plan: BodyFitPlan, userId: number): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to fetch person image for body-aware preprocessing: ${response.status}`);
  const input = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(input).metadata();
  if (!metadata.width || !metadata.height) throw new Error("Person image has no measurable dimensions");

  const imageWidth = metadata.width;
  const imageHeight = metadata.height;
  const crop = calculateFittingCrop(imageWidth, imageHeight, plan);
  const fitted = await sharp(input)
    .extract(crop)
    .resize({ width: 768, height: 1024, fit: "contain", background: { r: 248, g: 247, b: 244, alpha: 1 } })
    .png()
    .toBuffer();
  const uploaded = await storagePut(`fitted-person/${userId}/${Date.now()}.png`, fitted, "image/png");
  return storageGetSignedUrl(uploaded.key);
}
