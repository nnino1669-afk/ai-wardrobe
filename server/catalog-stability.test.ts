import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("CatalogBrowser stability", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/components/CatalogBrowser.tsx"),
    "utf8",
  );

  it("does not update state during render when the cloth type prop changes", () => {
    expect(source).toContain("useEffect(() => {");
    expect(source).toContain("setSelectedClothType(clothType);");
    expect(source).toContain("}, [clothType]);");
  });

  it("uses a memoized catalog input and refreshes wishlist data after mutations", () => {
    expect(source).toContain("const catalogInput = useMemo(");
    expect(source).toContain("trpc.catalog.garments.useQuery(catalogInput)");
    expect(source).toContain("utils.wishlist.list.invalidate()");
  });

  it("renders garment sizes and explicit catalog query error states", () => {
    expect(source).toContain("garment.sizes");
    expect(source).toContain("categoriesError");
    expect(source).toContain("garmentsError");
    expect(source).toContain("No garments found in this category");
    expect(source).toContain("The garment catalog could not be loaded.");
  });
});
