/**
 * Virtual Try-On service using Hugging Face-hosted models.
 *
 * IDM-VTON is the primary adapter because Hugging Face documents its
 * Gradio Space API. CatVTON remains available as an experimental fallback,
 * but its model page does not expose a stable hosted inference contract.
 */

import { Client, handle_file } from "@gradio/client";
import { ENV } from "./_core/env";
import type { PersonFitProfile } from "./bodyAware";

const HF_API_URL = "https://api-inference.huggingface.co/models";
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const IDM_VTON_SPACE = "yisol/IDM-VTON";
const CATVTON_MODEL = "zhengchong/CatVTON";

const MODELS = {
  idmvton: "idmvton",
  catvton: "catvton",
} as const;

type ModelType = keyof typeof MODELS;
type ClothType = "upper" | "lower" | "overall" | "inner" | "outer";

type GradioFile = {
  url?: string;
  path?: string;
  name?: string;
};

type GradioResult = {
  data?: unknown[];
};

import type { PersonLockProfile } from "./personLockAnalysis";

type BodyFitPlan = {
  confidence: number;
  bodyBox: { x: number; y: number; width: number; height: number };
  shoulderWidth: number;
  hipWidth: number;
  torsoRatio: number;
  fitScale: number;
  verticalAnchor: number;
  detectedAt: number;
};

interface VTONRequest {
  personImageUrl: string;
  garmentImageUrl: string;
  clothType: ClothType;
  model?: ModelType;
  fitProfile?: PersonFitProfile;
  bodyFitPlan?: BodyFitPlan;
  personLockProfile?: PersonLockProfile;
}

interface VTONResponse {
  imageUrl: string;
  success: boolean;
  error?: string;
}

let idmClientPromise: ReturnType<typeof Client.connect> | null = null;

function getIdmClient() {
  if (!idmClientPromise) {
    const token = ENV.huggingFaceApiToken || undefined;
    idmClientPromise = Client.connect(
      IDM_VTON_SPACE,
      token ? { token: token as `hf_${string}` } : undefined,
    );
  }
  return idmClientPromise;
}

function getGradioFileUrl(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const file = value as GradioFile;
  if (typeof file.url === "string") {
    return file.url;
  }
  if (typeof file.path === "string" && /^https?:\/\//.test(file.path)) {
    return file.path;
  }
  if (typeof file.name === "string" && /^https?:\/\//.test(file.name)) {
    return file.name;
  }

  return null;
}

function getRetryDelay(attempt: number): number {
  return RETRY_DELAY * Math.max(1, attempt + 1);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function callLocalVtonBridge(request: VTONRequest): Promise<string> {
  const bridgeUrl = process.env.LOCAL_VTON_URL || "http://localhost:8000/v1/vton/try-on";
  const resp = await fetch(bridgeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      person_image_url: request.personImageUrl,
      garment_image_url: request.garmentImageUrl,
      category: request.clothType,
      prompt: `${describeClothType(request.clothType)}. RTX 4060 optimized low-VRAM try-on.`,
      steps: 25,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => resp.statusText);
    throw new Error(`Local VTON Bridge error (${resp.status}): ${errText}`);
  }

  const data = (await resp.json()) as { result_url?: string };
  if (!data.result_url) {
    throw new Error("Local VTON Bridge returned no result_url");
  }
  return data.result_url;
}

async function callIdmVton(request: VTONRequest): Promise<string> {
  let lastError: unknown;
  const useLocal = process.env.USE_LOCAL_VTON === "true";

  if (useLocal) {
    try {
      return await callLocalVtonBridge(request);
    } catch (localErr) {
      console.warn("[VTON] Local VTON bridge unavailable, falling back to Gradio space:", localErr);
    }
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const app = await getIdmClient();
      const result = (await app.predict("/tryon", {
        dict: {
          background: handle_file(request.personImageUrl),
          layers: [],
          composite: null,
        },
        garm_img: handle_file(request.garmentImageUrl),
        garment_des: `${describeClothType(request.clothType)}. STRICT IDENTITY LOCK: Preserve the subject's exact face features, skin tone (${request.personLockProfile?.skinToneEstimate ?? "natural"}), hair color (${request.personLockProfile?.hairColorEstimate ?? "natural"}), body pose, head position, and background environment without modification. Only replace the clothing region corresponding to ${request.clothType}.${request.fitProfile ? ` Source aspect ratio ${request.fitProfile.aspectRatio}.` : ""}${request.bodyFitPlan ? ` Body landmark calibration: shoulder ratio ${request.bodyFitPlan.shoulderWidth}, hip ratio ${request.bodyFitPlan.hipWidth}, fit scale ${request.bodyFitPlan.fitScale}, vertical anchor ${request.bodyFitPlan.verticalAnchor}.` : ""}`,
        is_checked: true,
        is_checked_crop: false,
        denoise_steps: 30,
        seed: 42,
      })) as GradioResult;

      const resultUrl = getGradioFileUrl(result.data?.[0]);
      if (!resultUrl) {
        throw new Error("IDM-VTON returned no accessible result image");
      }
      return resultUrl;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) break;
      await sleep(getRetryDelay(attempt));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("IDM-VTON Space request failed");
}

async function callCatVton(request: VTONRequest): Promise<string> {
  const personImageBase64 = await imageUrlToBase64(request.personImageUrl);
  const garmentImageBase64 = await imageUrlToBase64(request.garmentImageUrl);
  const result = await callHuggingFaceAPI(CATVTON_MODEL, {
    inputs: {
      person_image: personImageBase64,
      garment_image: garmentImageBase64,
      cloth_type: mapClothType(request.clothType),
      fit_profile: request.fitProfile ?? null,
      body_fit_plan: request.bodyFitPlan ?? null,
    },
  });

  const resultImageBase64 = getBase64Image(result);
  if (!resultImageBase64) {
    throw new Error(
      "CatVTON did not return an image. Its Hugging Face model endpoint may not be deployed for inference.",
    );
  }

  return `data:image/png;base64,${resultImageBase64}`;
}

async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch source image: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

async function callHuggingFaceAPI(
  modelId: string,
  payload: unknown,
  retryCount = 0,
): Promise<unknown> {
  const token = ENV.huggingFaceApiToken;
  if (!token) {
    throw new Error("Hugging Face API token is not configured");
  }

  try {
    const response = await fetch(`${HF_API_URL}/${modelId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 503 && retryCount < MAX_RETRIES) {
      await sleep(getRetryDelay(retryCount));
      return callHuggingFaceAPI(modelId, payload, retryCount + 1);
    }

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (retryCount < MAX_RETRIES && error instanceof TypeError) {
      await sleep(getRetryDelay(retryCount));
      return callHuggingFaceAPI(modelId, payload, retryCount + 1);
    }
    throw error;
  }
}

function getBase64Image(result: unknown): string | null {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return null;

  const candidate = result as { image?: unknown };
  if (typeof candidate.image === "string") return candidate.image;

  if (Array.isArray(result) && result.length > 0 && typeof result[0] === "string") {
    return result[0];
  }

  return null;
}

export function requireInferenceUrl(value: string, fieldName: string): string {
  if (value.startsWith("data:")) {
    return value;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error();
    }
    return url.toString();
  } catch {
    throw new Error(`${fieldName} must be a valid absolute HTTP(S) URL`);
  }
}

export async function generateVirtualTryOn(
  request: VTONRequest,
): Promise<VTONResponse> {
  try {
    const normalizedRequest: VTONRequest = {
      ...request,
      personImageUrl: requireInferenceUrl(request.personImageUrl, "Person image URL"),
      garmentImageUrl: requireInferenceUrl(request.garmentImageUrl, "Garment image URL"),
    };
    const model = normalizedRequest.model || "idmvton";
    const imageUrl = model === MODELS.idmvton
      ? await callIdmVton(normalizedRequest)
      : await callCatVton(normalizedRequest);

    return {
      imageUrl,
      success: true,
    };
  } catch (error) {
    console.error("[VTON] Error generating virtual try-on:", error);
    return {
      imageUrl: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown virtual try-on error",
    };
  }
}

export function describeClothType(clothType: ClothType): string {
  const descriptions: Record<ClothType, string> = {
    upper: "high-realism upper-body garment matching the reference fabric texture, precise color tone, and natural anatomical drape; wrap seamlessly around the shoulders and torso with realistic folds and lighting",
    lower: "high-realism lower-body garment matching the reference fabric texture, precise waist fit, and natural leg drape; align cleanly with the subject's hips and stance",
    overall: "high-realism full-body outfit or dress matching the reference fabric weight, color fidelity, and continuous silhouette drape from shoulders to hem",
    inner: "high-realism inner layer or underwear garment matching the reference smooth contouring and close fit against the subject's body",
    outer: "high-realism outerwear upper-body layer such as a jacket, coat, or blazer matching the reference fabric structure and lapel details; place it cleanly over the visible torso and shoulders with natural outerwear volume",
  };
  return descriptions[clothType];
}

export function mapClothType(clothType: ClothType): string {
  const mapping: Record<ClothType, string> = {
    upper: "upper_body",
    lower: "lower_body",
    overall: "dress",
    inner: "inner",
    outer: "upper_body",
  };
  return mapping[clothType];
}

export async function validateHuggingFaceConfig(): Promise<boolean> {
  const token = ENV.huggingFaceApiToken;
  if (!token) return false;

  try {
    const response = await fetch(`${HF_API_URL}/gpt2`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.status !== 401;
  } catch {
    return false;
  }
}
