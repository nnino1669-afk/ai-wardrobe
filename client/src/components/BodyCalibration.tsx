import { useEffect, useState } from "react";
import { Loader2, ScanFace } from "lucide-react";
import { detectBodyFitPlan, type BodyFitPlan } from "@/lib/bodyFit";

type ClothType = "upper" | "lower" | "overall" | "inner" | "outer";

export function BodyCalibration({ preview, clothType, onPlanChange }: { preview: string; clothType: ClothType; onPlanChange: (plan: BodyFitPlan | null) => void }) {
  const [status, setStatus] = useState<"idle" | "detecting" | "ready" | "unavailable">("idle");
  const [plan, setPlan] = useState<BodyFitPlan | null>(null);

  useEffect(() => {
    let active = true;
    if (!preview) {
      setStatus("idle");
      setPlan(null);
      onPlanChange(null);
      return () => { active = false; };
    }

    setStatus("detecting");
    const image = new Image();
    image.onload = async () => {
      try {
        const detected = await detectBodyFitPlan(image, clothType);
        if (!active) return;
        setPlan(detected);
        onPlanChange(detected);
        setStatus(detected ? "ready" : "unavailable");
      } catch {
        if (!active) return;
        setPlan(null);
        onPlanChange(null);
        setStatus("unavailable");
      }
    };
    image.onerror = () => {
      if (!active) return;
      setPlan(null);
      onPlanChange(null);
      setStatus("unavailable");
    };
    image.src = preview;
    return () => { active = false; };
  }, [preview, clothType, onPlanChange]);

  if (!preview || status === "idle") return null;
  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3" aria-live="polite">
      <div className="flex items-center gap-2 text-sm font-medium"><ScanFace className="h-4 w-4 text-accent" /> Body-aware calibration</div>
      {status === "detecting" && <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Detecting body landmarks for proportion-aware fitting…</p>}
      {status === "ready" && plan && <p className="mt-2 text-xs text-muted-foreground">Detected body region with {Math.round(plan.confidence * 100)}% landmark confidence. The fitting plan adapts the garment scale and vertical anchor to this photo.</p>}
      {status === "unavailable" && <p className="mt-2 text-xs text-muted-foreground">Automatic landmark detection was unavailable. The studio will continue with the uploaded photo and manual group-person selection.</p>}
    </div>
  );
}
