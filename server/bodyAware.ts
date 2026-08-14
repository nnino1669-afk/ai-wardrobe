import sharp from "sharp";

export type PersonFitProfile = {
  imageWidth: number;
  imageHeight: number;
  aspectRatio: number;
  region: { x: number; y: number; width: number; height: number };
  source: "full-frame" | "selected-region";
};

export function createFitProfile(
  imageWidth: number,
  imageHeight: number,
  region?: { x: number; y: number; width: number; height: number },
): PersonFitProfile {
  if (!Number.isFinite(imageWidth) || !Number.isFinite(imageHeight) || imageWidth <= 0 || imageHeight <= 0) {
    throw new Error("Person image dimensions must be positive");
  }
  const selected = region ?? { x: 0, y: 0, width: 1, height: 1 };
  if (selected.x < 0 || selected.y < 0 || selected.width <= 0 || selected.height <= 0 || selected.x + selected.width > 1 || selected.y + selected.height > 1) {
    throw new Error("Person region must stay inside the image bounds");
  }
  return {
    imageWidth,
    imageHeight,
    aspectRatio: Number((imageWidth / imageHeight).toFixed(4)),
    region: selected,
    source: region ? "selected-region" : "full-frame",
  };
}

export async function analyzePersonImage(imageUrl: string, region?: { x: number; y: number; width: number; height: number }): Promise<PersonFitProfile> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to read person image for body calibration: ${response.status}`);
  const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
  if (!metadata.width || !metadata.height) throw new Error("Person image has no measurable dimensions");
  return createFitProfile(metadata.width, metadata.height, region);
}
