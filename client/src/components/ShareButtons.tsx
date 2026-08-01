import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Instagram, Share2, Facebook, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonsProps {
  imageUrl: string;
  title?: string;
  description?: string;
}

export function ShareButtons({
  imageUrl,
  title = "Check out my AI Wardrobe try-on!",
  description = "I created this virtual try-on using AI Wardrobe. See how clothes look on me before buying!",
}: ShareButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      setIsLoading(true);
      // Copy the image URL to clipboard
      await navigator.clipboard.writeText(imageUrl);
      toast.success("Image URL copied! Paste it in your Instagram caption.");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareToInstagram = async () => {
    try {
      setIsLoading(true);
      // Copy share text to clipboard for Instagram caption
      const shareText = `${title}\n\nDownload: ${imageUrl}`;
      await navigator.clipboard.writeText(shareText);
      toast.success("Share text copied! Download the image and post to Instagram");
      handleDownloadImage();
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareToTikTok = () => {
    toast.info("Download the image and upload it to TikTok");
    handleDownloadImage();
    setIsOpen(false);
  };

  const handleShareToPinterest = () => {
    const pinUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(title)}`;
    window.open(pinUrl, "pinterest-share", "width=750,height=600");
    setIsOpen(false);
    toast.success("Opening Pinterest...");
  };

  const handleShareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(title)}`;
    window.open(facebookUrl, "facebook-share", "width=750,height=600");
    setIsOpen(false);
    toast.success("Opening Facebook...");
  };

  const handleDownloadImage = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `ai-wardrobe-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${imageUrl}`)}`;
    window.open(whatsappUrl, "whatsapp-share", "width=750,height=600");
    setIsOpen(false);
    toast.success("Opening WhatsApp...");
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share Result
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Try-On</DialogTitle>
            <DialogDescription>
              Share your virtual try-on result on social media
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Instagram */}
            <Button
              onClick={handleShareToInstagram}
              variant="outline"
              className="w-full justify-start"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Instagram className="w-4 h-4 mr-2 text-pink-600" />
              )}
              Share to Instagram
            </Button>

            {/* TikTok */}
            <Button
              onClick={handleShareToTikTok}
              variant="outline"
              className="w-full justify-start"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.68v13.67a2.4 2.4 0 0 1-2.4 2.4 2.4 2.4 0 0 1-2.4-2.4 2.4 2.4 0 0 1 2.4-2.4c.34 0 .67.05.98.15V9.48a5.64 5.64 0 0 0-.98-.08 5.64 5.64 0 0 0-5.64 5.64 5.64 5.64 0 0 0 5.64 5.64 5.64 5.64 0 0 0 5.64-5.64V8.07a7.73 7.73 0 0 0 4.77 1.72V6.69z" />
                </svg>
              )}
              Share to TikTok
            </Button>

            {/* Pinterest */}
            <Button
              onClick={handleShareToPinterest}
              variant="outline"
              className="w-full justify-start"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4 mr-2 text-red-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path
                    d="M8 12c0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-4-4-4-4 1.79-4 4z"
                    fill="white"
                  />
                </svg>
              )}
              Save to Pinterest
            </Button>

            {/* Facebook */}
            <Button
              onClick={handleShareToFacebook}
              variant="outline"
              className="w-full justify-start"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Facebook className="w-4 h-4 mr-2 text-blue-600" />
              )}
              Share to Facebook
            </Button>

            {/* WhatsApp */}
            <Button
              onClick={handleShareToWhatsApp}
              variant="outline"
              className="w-full justify-start"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4 mr-2 text-green-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.782 1.14c-1.457.694-2.782 1.684-3.722 2.847-.94 1.162-1.464 2.511-1.477 3.887-.013 1.622.487 3.209 1.516 4.55.531.822 1.246 1.536 2.032 2.1.786.564 1.659.98 2.59 1.23 1.867.463 3.869.216 5.516-.644 1.647-1.086 2.79-2.637 3.268-4.365.478-1.728.216-3.554-.644-5.009-.859-1.454-2.338-2.429-3.942-2.767-.9-.19-1.84-.19-2.753 0z" />
                </svg>
              )}
              Share to WhatsApp
            </Button>

            {/* Copy Link */}
            <Button
              onClick={handleCopyToClipboard}
              variant="outline"
              className="w-full justify-start"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Copy Image URL
            </Button>

            {/* Download */}
            <Button
              onClick={handleDownloadImage}
              variant="default"
              className="w-full"
              disabled={isLoading}
            >
              Download Image
            </Button>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            <p className="font-semibold mb-2">💡 Sharing Tips:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Instagram:</strong> Download and share to Stories or Feed</li>
              <li>• <strong>TikTok:</strong> Download and create a video with the image</li>
              <li>• <strong>Pinterest:</strong> Click to save directly to your boards</li>
              <li>• <strong>Facebook:</strong> Share with your friends and family</li>
              <li>• <strong>WhatsApp:</strong> Send to friends and groups instantly</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
