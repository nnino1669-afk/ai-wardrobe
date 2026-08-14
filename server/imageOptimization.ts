import sharp from "sharp";

const supportedFormats = new Set(["jpeg", "jpg", "png", "webp"]);

export async function optimizeUploadedImage(buffer: Buffer, format: string): Promise<{ buffer: Buffer; format: "jpeg" | "png" | "webp"; contentType: string }> {
  const normalized = format.toLowerCase();
  if (!supportedFormats.has(normalized)) throw new Error("Unsupported image format");
  const outputFormat = normalized === "jpg" ? "jpeg" : normalized as "jpeg" | "png" | "webp";
  try {
    const optimized = await sharp(buffer)
      .rotate()
      .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
      .toFormat(outputFormat)
      .toBuffer();
    return { buffer: optimized, format: outputFormat, contentType: `image/${outputFormat}` };
  } catch {
    // Keep upload compatibility for legacy or partially corrupt images; the
    // downstream inference fetch will still report an actionable image error.
    return { buffer, format: outputFormat, contentType: `image/${outputFormat}` };
  }
}
