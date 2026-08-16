// Preconfigured storage helpers for Manus WebDev templates
// Uploads via Forge Server presigned URL to S3 (PUT direct).
// Downloads return /manus-storage/{key} paths served via 307 redirect.

import { ENV } from "./_core/env";

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY",
    );
  }

  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  // Local filesystem fallback when running offline without Forge credentials
  if (!forgeUrl || !forgeKey) {
    const fs = await import("fs/promises");
    const path = await import("path");
    const key = appendHashSuffix(normalizeKey(relKey));
    const uploadDir = path.resolve(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, key);
    const buffer = typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);
    await fs.writeFile(filePath, buffer);
    return {
      key,
      url: `/manus-storage/${key}`,
    };
  }

  const { forgeUrl: cleanUrl, forgeKey: keyVal } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));

  // 1. Get presigned PUT URL from Forge
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);

  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }

  const { url: s3Url } = (await presignResp.json()) as { url: string };
  if (!s3Url) throw new Error("Forge returned empty presign URL");

  // 2. PUT file directly to S3
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });

  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  const key = normalizeKey(relKey);

  if (!forgeUrl || !forgeKey) {
    if (key.startsWith("http://") || key.startsWith("https://") || key.startsWith("data:")) {
      return key;
    }
    return `/uploads/${key}`;
  }

  const { forgeUrl: cleanUrl, forgeKey: keyVal } = getForgeConfig();

  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);

  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }

  const { url } = (await resp.json()) as { url: string };
  return url;
}

/**
 * Resolve a browser-facing storage path into an absolute URL that external
 * inference providers can fetch. Absolute HTTP(S) URLs are preserved.
 */
export async function resolveInferenceUrl(value: string): Promise<string> {
  try {
    const absolute = new URL(value);
    if (absolute.protocol === "http:" || absolute.protocol === "https:") {
      return absolute.toString();
    }
  } catch {
    // Relative storage paths are handled below.
  }

  const storagePrefix = "/manus-storage/";
  if (!value.startsWith(storagePrefix)) {
    throw new Error("Inference image URL must be an absolute HTTP(S) URL or a Manus storage path");
  }

  const key = decodeURIComponent(value.slice(storagePrefix.length).split("?", 1)[0]);
  if (!key) {
    throw new Error("Inference image URL contains an empty Manus storage path");
  }

  const signedUrl = await storageGetSignedUrl(key);
  try {
    const absoluteSignedUrl = new URL(signedUrl);
    if (absoluteSignedUrl.protocol !== "http:" && absoluteSignedUrl.protocol !== "https:") {
      throw new Error();
    }
    return absoluteSignedUrl.toString();
  } catch {
    throw new Error("Storage provider returned an invalid inference URL");
  }
}
