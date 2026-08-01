/**
 * Virtual Try-On service using Hugging Face Inference API
 * Supports CatVTON and IDM-VTON models
 */

import { ENV } from "./_core/env";

const HF_API_URL = "https://api-inference.huggingface.co/models";
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Model identifiers on Hugging Face
const MODELS = {
  catvton: "miccunif/CatVTON",
  idmvton: "yisol/IDM-VTON",
} as const;

type ModelType = keyof typeof MODELS;
type ClothType = "upper" | "lower" | "overall" | "inner" | "outer";

interface VTONRequest {
  personImageUrl: string;
  garmentImageUrl: string;
  clothType: ClothType;
  model?: ModelType;
}

interface VTONResponse {
  imageUrl: string;
  success: boolean;
  error?: string;
}

/**
 * Convert image URL to base64 for Hugging Face API
 */
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  } catch (error) {
    console.error("[VTON] Failed to convert image to base64:", error);
    throw error;
  }
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call Hugging Face Inference API with retry logic
 */
async function callHuggingFaceAPI(
  modelId: string,
  payload: any,
  retryCount: number = 0
): Promise<any> {
  const token = ENV.huggingFaceApiToken;
  if (!token) {
    throw new Error("Hugging Face API token not configured");
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

    if (response.status === 503) {
      // Model is loading, retry after delay
      if (retryCount < MAX_RETRIES) {
        console.log(`[VTON] Model loading, retrying in ${RETRY_DELAY}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAY);
        return callHuggingFaceAPI(modelId, payload, retryCount + 1);
      }
      throw new Error("Model loading timeout after multiple retries");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[VTON] API error (${response.status}):`, errorText);
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (retryCount < MAX_RETRIES && error instanceof Error && error.message.includes("network")) {
      console.log(`[VTON] Network error, retrying in ${RETRY_DELAY}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY);
      return callHuggingFaceAPI(modelId, payload, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Call Hugging Face Inference API for virtual try-on
 */
export async function generateVirtualTryOn(
  request: VTONRequest
): Promise<VTONResponse> {
  try {
    const model = request.model || "catvton";
    const modelId = MODELS[model];

    console.log(`[VTON] Starting ${model} inference with cloth type: ${request.clothType}`);

    // Convert images to base64
    const personImageBase64 = await imageUrlToBase64(request.personImageUrl);
    const garmentImageBase64 = await imageUrlToBase64(request.garmentImageUrl);

    // Prepare payload for Hugging Face API
    const payload = {
      inputs: {
        person_image: personImageBase64,
        garment_image: garmentImageBase64,
        cloth_type: mapClothType(request.clothType),
      },
    };

    // Call Hugging Face Inference API with retry logic
    const result = await callHuggingFaceAPI(modelId, payload);

    // Parse response
    let resultImageBase64: string | null = null;

    if (typeof result === "string") {
      // Direct base64 response
      resultImageBase64 = result;
    } else if (result.image) {
      // Image in nested object
      resultImageBase64 = result.image;
    } else if (Array.isArray(result) && result.length > 0) {
      // Array response with image
      resultImageBase64 = result[0];
    }

    if (!resultImageBase64) {
      console.error("[VTON] No image in response:", result);
      return {
        imageUrl: "",
        success: false,
        error: "No image generated",
      };
    }

    // Convert base64 to data URL
    const imageUrl = `data:image/png;base64,${resultImageBase64}`;

    console.log("[VTON] Successfully generated virtual try-on");
    return {
      imageUrl,
      success: true,
    };
  } catch (error) {
    console.error("[VTON] Error generating virtual try-on:", error);
    return {
      imageUrl: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Map our cloth type enum to Hugging Face model expectations
 */
function mapClothType(clothType: ClothType): string {
  const mapping: Record<ClothType, string> = {
    upper: "upper_body",
    lower: "lower_body",
    overall: "dress",
    inner: "inner",
    outer: "outer",
  };
  return mapping[clothType] || clothType;
}

/**
 * Validate if Hugging Face API is properly configured
 */
export async function validateHuggingFaceConfig(): Promise<boolean> {
  const token = ENV.huggingFaceApiToken;
  if (!token) {
    console.warn("[VTON] Hugging Face API token not configured");
    return false;
  }

  try {
    // Test with a simple API call to verify token
    const response = await fetch(`${HF_API_URL}/gpt2`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      console.error("[VTON] Invalid Hugging Face API token");
      return false;
    }

    console.log("[VTON] Hugging Face API token validated");
    return true;
  } catch (error) {
    console.error("[VTON] Failed to validate Hugging Face config:", error);
    return false;
  }
}
