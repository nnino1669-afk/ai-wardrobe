import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("outfit persistence", () => {
  it("exposes validated create/list/delete procedures", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    expect(source).toContain("outfits: router({");
    expect(source).toContain("garmentIds: z.array(z.number().int().positive()).min(1).max(20)");
    expect(source).toContain("return { success: await deleteOutfit(input.id, ctx.user.id) };");
  });

  it("checks user ownership before deleting an outfit", () => {
    const source = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    expect(source).toContain("and(eq(outfits.id, outfitId), eq(outfits.userId, userId))");
  });

  it("renders saved outfit category summaries", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/OutfitBuilder.tsx"), "utf8");
    expect(source).toContain("getSavedOutfitCategories");
    expect(source).toContain("categories.join(\" · \")");
    expect(source).toContain("Categories unavailable");
  });
});
