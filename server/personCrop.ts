import sharp from "sharp";
import { storagePut } from "./storage";

export type NormalizedSelection = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function parseNormalizedSelection(selector: string): NormalizedSelection {
  const values = selector.split(",").map((value) => Number(value));
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("Person selection must contain four numeric percentages");
  }

  const [x, y, width, height] = values;
  if (
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0 ||
    x + width > 100 ||
    y + height > 100
  ) {
    throw new Error("Person selection must stay within the uploaded image");
  }

  return { x, y, width, height };
}

export async function cropSelectedPerson(
  imageUrl: string,
  selector: string,
  userId: number,
): Promise<{ imageUrl: string; selection: NormalizedSelection }> {
  const selection = parseNormalizedSelection(selector);
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch group photo: ${response.status}`);
  }

  const source = Buffer.from(await response.arrayBuffer());
  const image = sharp(source).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read group photo dimensions");
  }

  const left = Math.max(0, Math.floor((selection.x / 100) * metadata.width));
  const top = Math.max(0, Math.floor((selection.y / 100) * metadata.height));
  const width = Math.max(1, Math.min(metadata.width - left, Math.floor((selection.width / 100) * metadata.width)));
  const height = Math.max(1, Math.min(metadata.height - top, Math.floor((selection.height / 100) * metadata.height)));

  const cropped = await image
    .extract({ left, top, width, height })
    .png()
    .toBuffer();

  const upload = await storagePut(
    `input-images/${userId}/selected-person/${Date.now()}.png`,
    cropped,
    "image/png",
  );

  return {
    imageUrl: upload.url,
    selection,
  };
}
