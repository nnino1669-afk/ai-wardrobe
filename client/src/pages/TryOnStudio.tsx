import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, ArrowLeft, AlertCircle, Shirt } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { PersonSelector } from "@/components/PersonSelector";
import { BeforeAfterComparison } from "@/components/BeforeAfterComparison";
import { ShareButtons } from "@/components/ShareButtons";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { OutfitBuilder } from "@/components/OutfitBuilder";
import { StyleProfileCard } from "@/components/StyleProfileCard";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ClothType = "upper" | "lower" | "overall" | "inner" | "outer";
type VtonModel = "idmvton" | "catvton";

type CatalogGarment = {
  id: number;
  name: string;
  imageUrl: string;
  clothType: ClothType;
  brand?: string | null;
  color?: string | null;
  price?: number | null;
};

export default function TryOnStudio() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  const [personImage, setPersonImage] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState("");
  const [selectedGarment, setSelectedGarment] = useState<CatalogGarment | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<CatalogGarment[]>([]);
  const [clothType, setClothType] = useState<ClothType>("upper");
  const [selectedModel, setSelectedModel] = useState<VtonModel>("idmvton");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState("");
  const [personSelector, setPersonSelector] = useState("");
  const [isGroupPhoto, setIsGroupPhoto] = useState(false);
  const [processingError, setProcessingError] = useState("");

  const uploadImageMutation = trpc.tryOn.uploadImage.useMutation();
  const processMutation = trpc.tryOn.process.useMutation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/");
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading || !isAuthenticated) {
    return null;
  }

  const handlePersonImageSelect = (file: File, preview: string) => {
    setPersonImage(file);
    setPersonPreview(preview);
    setPersonSelector("");
    setResultImage("");
  };

  const handleGarmentSelect = (garment: CatalogGarment) => {
    setSelectedGarment(garment);
    setSelectedOutfit((current) => {
      if (garment.clothType === "overall") return [garment];
      return [...current.filter((item) => item.clothType !== garment.clothType), garment];
    });
    setClothType(garment.clothType);
    setResultImage("");
    setProcessingError("");
  };

  const handleLoadOutfit = (garments: Array<{ id: number; name: string; imageUrl: string; clothType: string }>) => {
    const normalized = garments.map((garment) => ({
      ...garment,
      clothType: garment.clothType as ClothType,
    }));
    setSelectedOutfit(normalized);
    const primary = normalized.find((garment) => garment.clothType !== "overall") ?? normalized[0];
    if (primary) {
      setSelectedGarment(primary);
      setClothType(primary.clothType);
    }
    setResultImage("");
    setProcessingError("");
    toast.success("Saved look loaded");
  };

  const handleTryOn = async () => {
    if (!personImage || !selectedGarment) {
      toast.error("Choose a person photo and a garment from the catalog first");
      return;
    }

    if (isGroupPhoto && !personSelector) {
      toast.error("Select the person in the group photo first");
      return;
    }

    setIsProcessing(true);
    setProcessingError("");
    setResultImage("");

    try {
      const personUploadResult = await uploadImageMutation.mutateAsync({
        imageData: personPreview,
        imageType: "person",
      });

      if (!personUploadResult.success || !personUploadResult.imageUrl) {
        throw new Error("Failed to upload person image");
      }

      const personImageUrl = personUploadResult.imageUrl;
      const garmentImageUrl = selectedGarment.imageUrl;
      const processResult = await processMutation.mutateAsync({
        personImageUrl,
        garmentImageUrl,
        clothType,
        model: selectedModel,
        personSelector: isGroupPhoto ? personSelector : undefined,
        name: `${selectedGarment.name} on mannequin`,
      });

      if (!processResult.success || !processResult.resultImageUrl) {
        throw new Error(processResult.error || "Failed to process try-on");
      }

      setResultImage(processResult.resultImageUrl);
      if (processResult.effectivePersonImageUrl) {
        setPersonPreview(processResult.effectivePersonImageUrl);
      }
      toast.success("Virtual try-on generated successfully!");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to process try-on";
      setProcessingError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) {
      toast.error("No result to download");
      return;
    }

    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `ai-wardrobe-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded!");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")} aria-label="Back to home">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Virtual Try-On Studio</h1>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Step 1: Upload your photo</h2>
              <ImageUpload
                label="Person Photo"
                onImageSelect={handlePersonImageSelect}
                preview={personPreview}
              />

              {personPreview && (
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">Is this a group photo?</label>
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={isGroupPhoto ? "default" : "outline"}
                      onClick={() => setIsGroupPhoto(true)}
                      className="flex-1"
                    >
                      Yes, it&apos;s a group
                    </Button>
                    <Button
                      variant={!isGroupPhoto ? "default" : "outline"}
                      onClick={() => {
                        setIsGroupPhoto(false);
                        setPersonSelector("");
                      }}
                      className="flex-1"
                    >
                      No, single person
                    </Button>
                  </div>
                  {isGroupPhoto && (
                    <PersonSelector
                      imageUrl={personPreview}
                      onPersonSelect={setPersonSelector}
                      isGroupPhoto
                    />
                  )}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Shirt className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-semibold">Step 2: Choose a garment</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                The selected garment will be fitted to the person in your photo. Choose from the catalog below.
              </p>
              <CatalogBrowser onGarmentSelect={handleGarmentSelect} clothType={clothType} />
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Step 3: Garment settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="vton-model">
                    Try-on model
                  </label>
                  <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value as VtonModel)}>
                    <SelectTrigger id="vton-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idmvton">IDM-VTON · high-fidelity primary</SelectItem>
                      <SelectItem value="catvton">CatVTON · experimental alternative</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-xs text-muted-foreground">
                    The result is a visual estimate. It preserves the uploaded person as closely as the model allows, but it cannot guarantee physical size or fit.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="garment-type">
                    Garment type
                  </label>
                  <Select value={clothType} onValueChange={(value) => setClothType(value as ClothType)}>
                    <SelectTrigger id="garment-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upper">Upper body</SelectItem>
                      <SelectItem value="lower">Lower body</SelectItem>
                      <SelectItem value="overall">Full outfit / dress</SelectItem>
                      <SelectItem value="inner">Inner layer</SelectItem>
                      <SelectItem value="outer">Outer layer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedGarment && (
                  <div className="flex gap-3 rounded-lg border border-border p-3 bg-muted/30">
                    <img
                      src={selectedGarment.imageUrl}
                      alt={selectedGarment.name}
                      className="h-20 w-20 rounded-md object-cover"
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{selectedGarment.name}</p>
                      {selectedGarment.brand && <p className="text-sm text-muted-foreground">{selectedGarment.brand}</p>}
                      {selectedGarment.color && <p className="text-sm text-muted-foreground">{selectedGarment.color}</p>}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <OutfitBuilder garments={selectedOutfit} onLoadOutfit={handleLoadOutfit} />
            <StyleProfileCard />

            <Button
              onClick={handleTryOn}
              disabled={!personImage || !selectedGarment || isProcessing}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fitting garment to your photo...
                </>
              ) : (
                "Generate Try-On"
              )}
            </Button>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Result Preview</h2>

              {processingError && (
                <Alert className="mb-4 bg-destructive/10 border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-sm text-destructive">{processingError}</AlertDescription>
                </Alert>
              )}

              {resultImage ? (
                <div className="space-y-4">
                  <BeforeAfterComparison
                    beforeImage={personPreview}
                    afterImage={resultImage}
                    beforeLabel="Original"
                    afterLabel="Try-On Result"
                  />
                  <div className="space-y-3">
                    <Button onClick={handleDownload} variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download Result
                    </Button>
                    <ShareButtons
                      imageUrl={resultImage}
                      title="Check out my AI Wardrobe try-on!"
                      description="I created this virtual try-on using AI Wardrobe. See how clothes look on me before buying!"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="w-12 h-12 rounded-lg bg-muted-foreground/10 flex items-center justify-center mx-auto mb-3">
                      <Download className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Upload a photo, choose a catalog garment, and generate a try-on result.
                    </p>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Your History</h2>
              <Button variant="outline" className="w-full" onClick={() => setLocation("/history")}>
                View All Try-Ons
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
