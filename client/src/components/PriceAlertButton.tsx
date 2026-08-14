import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const storageKey = (garmentId: number) => `ai-wardrobe-price-alert:${garmentId}`;

export function PriceAlertButton({ garmentId, currentPrice }: { garmentId: number; currentPrice: number | null }) {
  const [target, setTarget] = useState("");
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey(garmentId));
    if (!stored) return;
    setTarget(stored);
    setTracked(true);
    const targetCents = Number(stored);
    if (currentPrice != null && Number.isFinite(targetCents) && currentPrice <= targetCents) {
      toast.success("This garment has reached your tracked price");
    }
  }, [garmentId, currentPrice]);

  const handleSave = () => {
    const targetCents = Math.round(Number(target) * 100);
    if (!Number.isFinite(targetCents) || targetCents <= 0) {
      toast.error("Enter a valid target price");
      return;
    }
    window.localStorage.setItem(storageKey(garmentId), String(targetCents));
    setTarget((targetCents / 100).toFixed(2));
    setTracked(true);
    toast.success("Price alert saved on this device");
  };

  const handleRemove = () => {
    window.localStorage.removeItem(storageKey(garmentId));
    setTarget("");
    setTracked(false);
    toast.success("Price alert removed");
  };

  if (currentPrice == null) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        {tracked ? <BellRing className="h-4 w-4 text-accent" /> : <Bell className="h-4 w-4 text-muted-foreground" />}
        Track price
      </div>
      <div className="flex gap-2">
        <Input
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          inputMode="decimal"
          placeholder="Target price"
          aria-label="Target price"
        />
        <Button variant="outline" onClick={handleSave}>Save</Button>
      </div>
      {tracked && <Button variant="ghost" size="sm" onClick={handleRemove}>Remove alert</Button>}
      <p className="text-xs text-muted-foreground">Alerts are stored locally until a future account notification service is connected.</p>
    </div>
  );
}
