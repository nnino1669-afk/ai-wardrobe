import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Bookmark, Loader2, Trash2 } from "lucide-react";
import { ShareButtons } from "@/components/ShareButtons";
import { toast } from "sonner";

type OutfitGarment = {
  id: number;
  name: string;
  imageUrl: string;
  clothType: string;
};

interface OutfitBuilderProps {
  garments: OutfitGarment[];
  onLoadOutfit?: (garments: OutfitGarment[]) => void;
}

type CatalogCategoryLookup = {
  id: number;
  clothType: string;
};

export function getSavedOutfitCategories(
  garmentIds: number[],
  catalogGarments: CatalogCategoryLookup[],
): string[] {
  const labels: Record<string, string> = {
    upper: "Upper body",
    lower: "Lower body",
    overall: "Full outfit",
    inner: "Inner layer",
    outer: "Outerwear",
  };
  return Array.from(
    new Set(
      garmentIds
        .map((id) => catalogGarments.find((garment) => garment.id === id)?.clothType)
        .filter((clothType): clothType is string => Boolean(clothType))
        .map((clothType) => labels[clothType] ?? clothType),
    ),
  );
}

function parseGarmentIds(value: string): number[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === "number") : [];
  } catch {
    return [];
  }
}

export function OutfitBuilder({ garments, onLoadOutfit }: OutfitBuilderProps) {
  const [name, setName] = useState("");
  const [compareOutfitIds, setCompareOutfitIds] = useState<number[]>([]);
  const utils = trpc.useUtils();
  const { data: savedOutfits = [], isLoading } = trpc.outfits.list.useQuery();
  const { data: catalogGarments = [] } = trpc.catalog.garments.useQuery({});
  const createOutfit = trpc.outfits.create.useMutation({
    onSuccess: async () => {
      await utils.outfits.list.invalidate();
      setName("");
      toast.success("Outfit saved");
    },
    onError: () => toast.error("Could not save this outfit"),
  });
  const deleteOutfit = trpc.outfits.delete.useMutation({
    onSuccess: async () => {
      await utils.outfits.list.invalidate();
      toast.success("Outfit removed");
    },
    onError: () => toast.error("Could not remove this outfit"),
  });

  const selectedIds = useMemo(() => garments.map((garment) => garment.id), [garments]);

  const handleToggleCompare = (id: number) => {
    setCompareOutfitIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) {
        toast.error("Compare up to two saved looks at a time");
        return current;
      }
      return [...current, id];
    });
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Give the outfit a name first");
      return;
    }
    if (selectedIds.length === 0) {
      toast.error("Choose at least one catalog garment first");
      return;
    }

    createOutfit.mutate({
      name: trimmedName,
      description: "Saved from the AI Wardrobe catalog",
      garmentIds: selectedIds,
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">Save a look</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Build a look from catalog pieces, then save it for later comparison.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{garments.length} selected</span>
      </div>

      {garments.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {garments.map((garment) => (
            <div key={garment.id} className="rounded-lg border border-border overflow-hidden bg-muted/20">
              <img src={garment.imageUrl} alt={garment.name} className="aspect-square w-full object-cover" loading="lazy" />
              <div className="p-2">
                <p className="text-xs font-medium truncate">{garment.name}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{garment.clothType}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground mb-4">
          Select garments from the catalog to start a look.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Monday office look"
          aria-label="Outfit name"
        />
        <Button onClick={handleSave} disabled={createOutfit.isPending || garments.length === 0} className="sm:w-auto">
          {createOutfit.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bookmark className="w-4 h-4 mr-2" />}
          Save look
        </Button>
      </div>

      <div className="mt-6 pt-5 border-t border-border">
        <h3 className="text-sm font-semibold mb-3">Saved looks</h3>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : savedOutfits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved looks yet.</p>
        ) : (
          <div className="space-y-4">
            {compareOutfitIds.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div><p className="font-medium">Compare saved looks</p><p className="text-xs text-muted-foreground">Select up to two looks below.</p></div>
                  <Button variant="ghost" size="sm" onClick={() => setCompareOutfitIds([])}>Clear</Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedOutfits.filter((outfit) => compareOutfitIds.includes(outfit.id)).map((outfit) => {
                    const preview = parseGarmentIds(outfit.garmentIds).map((id) => catalogGarments.find((garment) => garment.id === id)).filter(Boolean)[0];
                    return <div key={outfit.id} className="rounded-md border border-border bg-background p-2"><p className="text-sm font-medium truncate mb-2">{outfit.name}</p>{preview ? <img src={preview.imageUrl} alt={outfit.name} className="aspect-square w-full rounded object-cover" /> : <div className="aspect-square rounded bg-muted" />}</div>;
                  })}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savedOutfits.map((outfit) => {
                const garmentIds = parseGarmentIds(outfit.garmentIds);
                const ids = new Set(garmentIds);
                const count = garments.filter((garment) => ids.has(garment.id)).length;
                const categories = getSavedOutfitCategories(garmentIds, catalogGarments);
                const savedGarments = garmentIds
                  .map((id) => catalogGarments.find((garment) => garment.id === id))
                  .filter((garment): garment is (typeof catalogGarments)[number] => Boolean(garment));
                return (
                  <div key={outfit.id} className="rounded-lg border border-border overflow-hidden bg-background">
                    <div className="grid grid-cols-4 gap-1 bg-muted p-1">
                      {savedGarments.slice(0, 4).map((garment) => <img key={garment.id} src={garment.imageUrl} alt="" className="aspect-square w-full rounded object-cover" loading="lazy" />)}
                      {savedGarments.length === 0 && <div className="col-span-4 aspect-[4/1] rounded bg-muted" />}
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="font-medium truncate">{outfit.name}</p>
                      <p className="text-xs text-muted-foreground">{count || ids.size} catalog piece{(count || ids.size) === 1 ? "" : "s"}</p>
                      <p className="text-xs text-muted-foreground/80 truncate" title={categories.join(" · ")}>{categories.length > 0 ? categories.join(" · ") : "Categories unavailable"}</p>
                      <div className="flex flex-wrap gap-2">
                        {onLoadOutfit && <Button variant="outline" size="sm" onClick={() => onLoadOutfit(savedGarments)} disabled={savedGarments.length === 0}>Load</Button>}
                        <Button variant={compareOutfitIds.includes(outfit.id) ? "default" : "outline"} size="sm" onClick={() => handleToggleCompare(outfit.id)}>Compare</Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteOutfit.mutate({ id: outfit.id })} disabled={deleteOutfit.isPending} aria-label={`Delete ${outfit.name}`}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                      {savedGarments[0]?.imageUrl && <ShareButtons imageUrl={savedGarments[0].imageUrl} title={`My AI Wardrobe look: ${outfit.name}`} description={`Saved look with ${categories.join(", ") || "catalog garments"}.`} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
