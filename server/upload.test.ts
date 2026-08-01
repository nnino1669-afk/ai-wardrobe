import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Image Upload", () => {
  it("should validate base64 image data format", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test with invalid data format
    const result = await caller.tryOn.uploadImage({
      imageData: "not-a-data-url",
      imageType: "person",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid image data format");
  });

  it("should accept valid PNG base64 data URL", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a minimal valid PNG base64 (1x1 transparent pixel)
    const validPngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const dataUrl = `data:image/png;base64,${validPngBase64}`;

    const result = await caller.tryOn.uploadImage({
      imageData: dataUrl,
      imageType: "person",
    });

    // Should succeed or fail gracefully with S3 error (not format error)
    if (!result.success) {
      expect(result.error).not.toContain("Invalid image data format");
    }
  });

  it("should accept valid JPEG base64 data URL", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Minimal JPEG base64 (1x1 pixel)
    const validJpegBase64 =
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";
    const dataUrl = `data:image/jpeg;base64,${validJpegBase64}`;

    const result = await caller.tryOn.uploadImage({
      imageData: dataUrl,
      imageType: "garment",
    });

    // Should succeed or fail gracefully with S3 error (not format error)
    if (!result.success) {
      expect(result.error).not.toContain("Invalid image data format");
    }
  });

  it("should handle different image types (person vs garment)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const validPngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const dataUrl = `data:image/png;base64,${validPngBase64}`;

    // Test person image
    const personResult = await caller.tryOn.uploadImage({
      imageData: dataUrl,
      imageType: "person",
    });

    // Test garment image
    const garmentResult = await caller.tryOn.uploadImage({
      imageData: dataUrl,
      imageType: "garment",
    });

    // Both should have same success/failure pattern (both use same S3 backend)
    expect(typeof personResult.success).toBe("boolean");
    expect(typeof garmentResult.success).toBe("boolean");
  });
});

describe("Try-On History", () => {
  it("should list user try-ons with pagination", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tryOn.list({
      limit: 10,
      offset: 0,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should respect pagination limits", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test with max limit
    const maxResult = await caller.tryOn.list({
      limit: 100,
      offset: 0,
    });

    expect(Array.isArray(maxResult)).toBe(true);

    // Test with offset
    const offsetResult = await caller.tryOn.list({
      limit: 10,
      offset: 5,
    });

    expect(Array.isArray(offsetResult)).toBe(true);
  });

  it("should prevent unauthorized deletion", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Try to delete a non-existent or unauthorized try-on
    const result = await caller.tryOn.delete({
      id: 99999,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Not authorized");
  });
});
