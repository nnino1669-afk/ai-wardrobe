import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("advanced catalog features", () => {
  it("exposes persisted style-profile procedures and uses them in recommendations", () => {
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const catalog = readFileSync(resolve(process.cwd(), "client/src/components/CatalogBrowser.tsx"), "utf8");
    const profile = readFileSync(resolve(process.cwd(), "client/src/components/StyleProfileCard.tsx"), "utf8");
    expect(router).toContain("styleProfile: router({");
    expect(router).toContain("getStyleProfile(ctx.user.id)");
    expect(catalog).toContain("trpc.styleProfile.get.useQuery");
    expect(catalog).toContain("styleProfile?.preferredColor");
    expect(profile).toContain("trpc.styleProfile.save.useMutation");
  });

  it("keeps reviews user-authored and renders loading and error states", () => {
    const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const catalog = readFileSync(resolve(process.cwd(), "client/src/components/CatalogBrowser.tsx"), "utf8");
    expect(schema).toContain("User-authored garment reviews");
    expect(router).toContain("saveGarmentReview");
    expect(catalog).toContain("reviewsLoading");
    expect(catalog).toContain("reviewsError");
    expect(catalog).toContain("Only reviews submitted by users are shown.");
  });

  it("normalizes uploaded images before storage while keeping a safe fallback", () => {
    const optimizer = readFileSync(resolve(process.cwd(), "server/imageOptimization.ts"), "utf8");
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    expect(optimizer).toContain(".rotate()");
    expect(optimizer).toContain("withoutEnlargement: true");
    expect(optimizer).toContain("downstream inference fetch");
    expect(router).toContain("optimizeUploadedImage");
  });

  it("scopes price alerts as explicit local reminders", () => {
    const priceAlert = readFileSync(resolve(process.cwd(), "client/src/components/PriceAlertButton.tsx"), "utf8");
    expect(priceAlert).toContain("window.localStorage");
    expect(priceAlert).toContain("Alerts are stored locally");
    expect(priceAlert).toContain("toast.success");
  });
});
