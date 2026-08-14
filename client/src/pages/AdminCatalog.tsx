import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BarChart3, Loader2, Plus, Upload } from "lucide-react";

const defaultForm = { categoryId: "1", name: "", description: "", imageUrl: "", clothType: "upper", color: "", sizes: "XS,S,M,L,XL", price: "", brand: "" };

type CatalogForm = typeof defaultForm;

export default function AdminCatalog() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState<CatalogForm>(defaultForm);
  const [bulkJson, setBulkJson] = useState("");
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const analytics = trpc.admin.analytics.useQuery(undefined, { enabled: isAdmin, retry: false });
  const garments = trpc.admin.garments.useQuery(undefined, { enabled: isAdmin, retry: false });
  const createMutation = trpc.admin.createGarment.useMutation({
    onSuccess: async () => { await Promise.all([utils.admin.garments.invalidate(), utils.admin.analytics.invalidate()]); setForm(defaultForm); toast.success("Garment added to catalog"); },
    onError: () => toast.error("Could not add garment"),
  });
  const updateMutation = trpc.admin.updateGarment.useMutation({
    onSuccess: async () => { await Promise.all([utils.admin.garments.invalidate(), utils.catalog.garments.invalidate()]); toast.success("Catalog garment updated"); },
    onError: () => toast.error("Could not update garment"),
  });
  const bulkMutation = trpc.admin.bulkImport.useMutation({
    onSuccess: async (result) => { await Promise.all([utils.admin.garments.invalidate(), utils.admin.analytics.invalidate()]); setBulkJson(""); toast.success(`${result.imported} garments imported`); },
    onError: () => toast.error("Bulk import must be a valid JSON array with catalog fields"),
  });

  const metrics = useMemo(() => [
    ["Active garments", analytics.data?.activeGarments ?? 0],
    ["Categories", analytics.data?.categories ?? 0],
    ["Try-ons", analytics.data?.tryOns ?? 0],
    ["Users", analytics.data?.users ?? 0],
  ], [analytics.data]);

  const updateField = (key: keyof CatalogForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const handleCreate = () => {
    if (!form.name.trim() || !form.imageUrl.trim()) { toast.error("Name and image URL are required"); return; }
    createMutation.mutate({
      categoryId: Number(form.categoryId), name: form.name.trim(), description: form.description.trim() || undefined, imageUrl: form.imageUrl.trim(), clothType: form.clothType as "upper" | "lower" | "overall" | "inner" | "outer", color: form.color.trim() || undefined, sizes: form.sizes.trim() || undefined, price: form.price ? Math.round(Number(form.price) * 100) : undefined, brand: form.brand.trim() || undefined,
    });
  };
  const handleBulkImport = () => {
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error("Expected array");
      bulkMutation.mutate({ garments: parsed });
    } catch { toast.error("Paste a valid JSON array"); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Sign in to access catalog administration.</div>;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-destructive">Administrator access is required.</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div><p className="text-sm text-muted-foreground">AI Wardrobe administration</p><h1 className="text-3xl font-semibold tracking-tight">Catalog management</h1></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{metrics.map(([label, value]) => <Card key={label} className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></Card>)}</div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2"><Plus className="h-5 w-5 text-accent" /><h2 className="text-lg font-semibold">Add catalog garment</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="admin-name">Name</Label><Input id="admin-name" value={form.name} onChange={(e) => updateField("name", e.target.value)} /></div>
              <div className="space-y-2"><Label>Clothing type</Label><Select value={form.clothType} onValueChange={(v) => updateField("clothType", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["upper", "lower", "overall", "inner", "outer"].map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="admin-category">Category ID</Label><Input id="admin-category" type="number" min="1" value={form.categoryId} onChange={(e) => updateField("categoryId", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="admin-color">Color</Label><Input id="admin-color" value={form.color} onChange={(e) => updateField("color", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="admin-brand">Brand</Label><Input id="admin-brand" value={form.brand} onChange={(e) => updateField("brand", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="admin-price">Price in dollars</Label><Input id="admin-price" inputMode="decimal" value={form.price} onChange={(e) => updateField("price", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="admin-sizes">Sizes</Label><Input id="admin-sizes" value={form.sizes} onChange={(e) => updateField("sizes", e.target.value)} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="admin-image">Image URL or /manus-storage path</Label><Input id="admin-image" value={form.imageUrl} onChange={(e) => updateField("imageUrl", e.target.value)} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="admin-description">Description</Label><Textarea id="admin-description" value={form.description} onChange={(e) => updateField("description", e.target.value)} maxLength={2000} /></div>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>{createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add garment</Button>
          </Card>
          <Card className="p-6 space-y-4"><div className="flex items-center gap-2"><Upload className="h-5 w-5 text-accent" /><h2 className="text-lg font-semibold">Bulk import</h2></div><p className="text-sm text-muted-foreground">Paste a JSON array using the same fields as the add form. Only supplied catalog records are imported.</p><Textarea value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} placeholder='[{"categoryId":1,"name":"...","imageUrl":"/manus-storage/...","clothType":"upper"}]' className="min-h-44 font-mono text-xs" /><Button variant="outline" onClick={handleBulkImport} disabled={!bulkJson.trim() || bulkMutation.isPending}>Import JSON</Button></Card>
        </div>
        <Card className="p-6"><div className="flex items-center gap-2 mb-4"><BarChart3 className="h-5 w-5 text-accent" /><h2 className="text-lg font-semibold">Catalog inventory</h2></div>{garments.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <div className="space-y-2">{(garments.data ?? []).map((garment) => <div key={garment.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-medium truncate">{garment.name}</p><p className="text-xs text-muted-foreground">#{garment.id} · {garment.clothType} · {garment.isActive ? "Active" : "Archived"}</p></div><Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: garment.id, patch: { isActive: garment.isActive ? 0 : 1 } })}>{garment.isActive ? "Archive" : "Activate"}</Button></div>)}</div>}</Card>
      </div>
    </DashboardLayout>
  );
}
