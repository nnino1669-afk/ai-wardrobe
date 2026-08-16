import { describe, it, expect, vi } from "vitest";
import { generateVirtualTryOn } from "./vton";

describe("Local VTON Bridge Integration", () => {
  it("should attempt local bridge when USE_LOCAL_VTON is enabled", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ result_url: "https://example.com/result.jpg" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const originalEnv = process.env.USE_LOCAL_VTON;
    process.env.USE_LOCAL_VTON = "true";

    const res = await generateVirtualTryOn({
      personImageUrl: "https://example.com/person.jpg",
      garmentImageUrl: "https://example.com/garment.jpg",
      clothType: "upper",
    });

    expect(res.success).toBe(true);
    expect(res.imageUrl).toBe("https://example.com/result.jpg");
    expect(fetchSpy).toHaveBeenCalled();

    process.env.USE_LOCAL_VTON = originalEnv;
    fetchSpy.mockRestore();
  });
});
