import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("TryOnStudio hook stability", () => {
  it("keeps tRPC mutation hooks outside handleTryOn", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/pages/TryOnStudio.tsx"),
      "utf8",
    );
    const handlerStart = source.indexOf("const handleTryOn = async");

    expect(handlerStart).toBeGreaterThan(-1);
    expect(source.slice(handlerStart)).not.toContain(".useMutation(");
    expect(source).toContain("const uploadImageMutation = trpc.tryOn.uploadImage.useMutation();");
    expect(source).toContain("const processMutation = trpc.tryOn.process.useMutation();");
    expect(source).toContain("The AI try-on model could not process this request.");
    expect(source).toContain("Hugging Face's free GPU quota is temporarily exhausted.");
    expect(source).toContain("Outerwear is processed as an upper-body layer.");
    expect(source).toContain("Outerwear requires a clear photo with visible shoulders and torso.");
  });
});

describe("History comparison stability", () => {
  it("keeps authentication navigation in an effect and exposes comparison controls", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/History.tsx"), "utf8");
    expect(source).toContain("useEffect(() => {");
    expect(source).toContain("const { isAuthenticated, loading } = useAuth();");
    expect(source).toContain("if (loading) return;");
    expect(source).toContain("enabled: !loading && isAuthenticated");
    expect(source).toContain("setLocation(\"/\")");
    expect(source).toContain("handleToggleCompare");
    expect(source).toContain("Compare selected looks");
  });
});
