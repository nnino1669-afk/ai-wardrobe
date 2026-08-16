export interface OllamaOptions {
  model?: string;
  baseUrl?: string;
  temperature?: number;
}

export async function generateOllamaResponse(
  prompt: string,
  options: OllamaOptions = {}
): Promise<string> {
  const model = options.model || process.env.OLLAMA_MODEL || "llama3";
  const baseUrl = options.baseUrl || process.env.OLLAMA_HOST || "http://localhost:11434";

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`Ollama API error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as { response?: string };
    return data.response || "No response generated from Ollama.";
  } catch (error: any) {
    console.warn("[Ollama] Local LLM unavailable or failed:", error.message);
    throw new Error(`Local Ollama service unreachable at ${baseUrl} using model '${model}'. Ensure Ollama is running locally.`);
  }
}
