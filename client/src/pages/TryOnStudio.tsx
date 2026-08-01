import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, ArrowLeft, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { PersonSelector } from "@/components/PersonSelector";
import { BeforeAfterComparison } from "@/components/BeforeAfterComparison";
import { ShareButtons } from "@/components/ShareButtons";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ClothType = "upper" | "lower" | "overall" | "inner" | "outer";

export default function TryOnStudio() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string>("");
  const [garmentImage, setGarmentImage] = useState<File | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string>("");
  const [clothType, setClothType] = useState<ClothType>("upper");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string>("");
  const [personSelector, setPersonSelector] = useState<string>("");
  const [isGroupPhoto, setIsGroupPhoto] = useState(false);
  const [processingError, setProcessingError] = useState<string>("");

  // Redirect if not authenticated
  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const handlePersonImageSelect = (file: File, preview: string) => {
    setPersonImage(file);
    setPersonPreview(preview);
    setPersonSelector(""); // Reset selector when new image is uploaded
  };

  const handleGarmentImageSelect = (file: File, preview: string) => {
    setGarmentImage(file);
    setGarmentPreview(preview);
  };

  const handleTryOn = async () => {
    if (!personImage || !garmentImage) {
      toast.error("Please upload both person and garment images");
      return;
    }

    if (isGroupPhoto && !personSelector) {
      toast.error("Please select the person in the group photo");
      return;
    }

    setIsProcessing(true);
    setProcessingError("");
    setResultImage("");

    try {
      // Upload person image to S3
      const personUploadMutation = trpc.tryOn.uploadImage.useMutation();
      const personUploadResult = await new Promise<any>((resolve) => {
        personUploadMutation.mutate(
          {
            imageData: personPreview,
            imageType: "person",
          },
          {
            onSuccess: (result) => resolve(result),
            onError: () => resolve({ success: false }),
          }
        );
      });

      if (!personUploadResult?.success) {
        setProcessingError("Failed to upload person image");
        toast.error("Failed to upload person image");
        setIsProcessing(false);
        return;
      }

      // Upload garment image to S3
      const garmentUploadMutation = trpc.tryOn.uploadImage.useMutation();
      const garmentUploadResult = await new Promise<any>((resolve) => {
        garmentUploadMutation.mutate(
          {
            imageData: garmentPreview,
            imageType: "garment",
          },
          {
            onSuccess: (result) => resolve(result),
            onError: () => resolve({ success: false }),
          }
        );
      });

      if (!garmentUploadResult?.success) {
        setProcessingError("Failed to upload garment image");
        toast.error("Failed to upload garment image");
        setIsProcessing(false);
        return;
      }

      // Process virtual try-on with S3 URLs
      const processMutation = trpc.tryOn.process.useMutation({
        onSuccess: (result) => {
          if (result.success) {
            setResultImage(result.resultImageUrl || "");
            toast.success("Virtual try-on generated successfully!");
          } else {
            setProcessingError(result.error || "Failed to process try-on");
            toast.error(result.error || "Failed to process try-on");
          }
          setIsProcessing(false);
        },
        onError: (error) => {
          const errorMsg = error.message || "Failed to process try-on";
          setProcessingError(errorMsg);
          toast.error(errorMsg);
          setIsProcessing(false);
        },
      });

      processMutation.mutate({
        personImageUrl: personUploadResult?.imageUrl || "",
        garmentImageUrl: garmentUploadResult?.imageUrl || "",
        clothType,
        personSelector: isGroupPhoto ? personSelector : undefined,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to process try-on";
      setProcessingError(errorMsg);
      toast.error(errorMsg);
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
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Virtual Try-On Studio</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Upload & Settings */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Step 1: Upload Photos</h2>
              
              <div className="space-y-6">
                {/* Person Image Upload */}
                <div>
                  <ImageUpload
                    label="Person Photo"
                    onImageSelect={handlePersonImageSelect}
                    preview={personPreview}
                  />
                </div>

                {/* Person Selector for Group Photos */}
                {personPreview && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Group Photo?
                    </label>
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant={isGroupPhoto ? "default" : "outline"}
                        onClick={() => setIsGroupPhoto(true)}
                        className="flex-1"
                      >
                        Yes, it's a group
                      </Button>
                      <Button
                        variant={!isGroupPhoto ? "default" : "outline"}
                        onClick={() => setIsGroupPhoto(false)}
                        className="flex-1"
                      >
                        No, single person
                      </Button>
                    </div>
                    {isGroupPhoto && (
                      <PersonSelector
                        imageUrl={personPreview}
                        onPersonSelect={setPersonSelector}
                        isGroupPhoto={true}
                      />
                    )}
                  </div>
                )}

                {/* Garment Image Upload */}
                <div>
                  <ImageUpload
                    label="Garment Photo"
                    onImageSelect={handleGarmentImageSelect}
                    preview={garmentPreview}
                  />
                </div>
              </div>
            </Card>

            {/* Settings */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Step 2: Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Garment Type
                  </label>
                  <Select value={clothType} onValueChange={(value) => setClothType(value as ClothType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upper">Upper Body (Shirts, Tops)</SelectItem>
                      <SelectItem value="lower">Lower Body (Pants, Skirts)</SelectItem>
                      <SelectItem value="overall">Full Outfit (Dresses)</SelectItem>
                      <SelectItem value="inner">Inner Layer (T-shirts)</SelectItem>
                      <SelectItem value="outer">Outer Layer (Jackets)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <Button
              onClick={handleTryOn}
              disabled={!personImage || !garmentImage || isProcessing}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing... (this may take a minute)
                </>
              ) : (
                "Generate Try-On"
              )}
            </Button>
          </div>

          {/* Right: Result Preview */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Result Preview</h2>
              
              {processingError && (
                <Alert className="mb-4 bg-destructive/10 border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-sm text-destructive">
                    {processingError}
                  </AlertDescription>
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
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="w-full"
                    >
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
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-lg bg-muted-foreground/10 flex items-center justify-center mx-auto mb-3">
                      <Download className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Upload images and click "Generate Try-On" to see the result
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* History Link */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Your History</h2>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/history")}
              >
                View All Try-Ons
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
