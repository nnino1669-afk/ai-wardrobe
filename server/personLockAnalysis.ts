import sharp from "sharp";

export interface PersonLockProfile {
  width: number;
  height: number;
  aspectRatio: number;
  hasClearFaceRegion: boolean;
  poseConfidence: number;
  silhouetteBounds: { top: number; left: number; bottom: number; right: number };
  skinToneEstimate: string;
  hairColorEstimate: string;
  lockedAt: number;
}

export async function analyzePersonForLock(imageBuffer: Buffer): Promise<PersonLockProfile> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width ?? 800;
  const height = metadata.height ?? 1000;
  const aspectRatio = Number((width / height).toFixed(2));

  // Compute actual image statistics and edge variance for clarity/pose confidence
  const { data, info } = await sharp(imageBuffer)
    .grayscale()
    .resize(150, 200, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let totalVal = 0;
  let edgeVariance = 0;
  const len = data.length;
  for (let i = 0; i < len; i++) {
    const val = data[i]!;
    totalVal += val;
    if (i > 0) {
      const diff = val - data[i - 1]!;
      edgeVariance += diff * diff;
    }
  }
  const meanBrightness = totalVal / len;
  const clarityScore = Math.min(1, Math.max(0.2, (edgeVariance / len) / 1000));
  const poseConfidence = Number((0.5 + clarityScore * 0.45).toFixed(2));
  const hasClearFaceRegion = width >= 300 && height >= 400 && meanBrightness > 30 && meanBrightness < 235;

  const stats = await sharp(imageBuffer)
    .resize(200, 250, { fit: "inside" })
    .stats();

  const meanR = stats.channels[0]?.mean ?? 128;
  const meanG = stats.channels[1]?.mean ?? 128;
  const meanB = stats.channels[2]?.mean ?? 128;

  let skinToneEstimate = "Medium";
  if (meanR > 180 && meanG > 160 && meanB > 140) {
    skinToneEstimate = "Fair / Light";
  } else if (meanR < 110 && meanG < 90 && meanB < 80) {
    skinToneEstimate = "Deep";
  } else {
    skinToneEstimate = "Olive / Tan";
  }

  let hairColorEstimate = "Dark / Natural";
  if (meanR > meanB + 30 && meanG > meanB + 20) {
    hairColorEstimate = "Warm / Auburn / Blonde";
  } else if (meanR < 90 && meanG < 90 && meanB < 90) {
    hairColorEstimate = "Dark / Black";
  } else {
    hairColorEstimate = "Brown";
  }

  return {
    width,
    height,
    aspectRatio,
    hasClearFaceRegion,
    poseConfidence,
    silhouetteBounds: {
      top: Math.round(height * 0.04),
      left: Math.round(width * 0.08),
      bottom: Math.round(height * 0.96),
      right: Math.round(width * 0.92),
    },
    skinToneEstimate,
    hairColorEstimate,
    lockedAt: Date.now(),
  };
}
