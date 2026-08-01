import { useState, useRef, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PersonSelectorProps {
  imageUrl: string;
  onPersonSelect: (selector: string) => void;
  isGroupPhoto: boolean;
}

interface Selection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function PersonSelector({
  imageUrl,
  onPersonSelect,
  isGroupPhoto,
}: PersonSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw selection box if exists
      if (selection) {
        ctx.strokeStyle = "rgba(255, 193, 7, 0.8)";
        ctx.lineWidth = 3;
        ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);

        // Fill with semi-transparent yellow
        ctx.fillStyle = "rgba(255, 193, 7, 0.1)";
        ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
      }
    };
    img.src = imageUrl;
  }, [imageUrl, selection, imageLoaded]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isGroupPhoto) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isGroupPhoto) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = Math.abs(currentX - startPos.x);
    const height = Math.abs(currentY - startPos.y);
    const x = Math.min(startPos.x, currentX);
    const y = Math.min(startPos.y, currentY);

    setSelection({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);

    if (selection && selection.width > 0 && selection.height > 0) {
      // Encode selection as percentage-based coordinates for reproducibility
      const canvas = canvasRef.current;
      if (canvas) {
        const selector = `${(selection.x / canvas.width * 100).toFixed(1)},${(selection.y / canvas.height * 100).toFixed(1)},${(selection.width / canvas.width * 100).toFixed(1)},${(selection.height / canvas.height * 100).toFixed(1)}`;
        onPersonSelect(selector);
      }
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className="space-y-3">
      {isGroupPhoto && (
        <Alert className="bg-accent/10 border-accent/20">
          <AlertCircle className="h-4 w-4 text-accent" />
          <AlertDescription className="text-sm text-accent-foreground/80">
            Click and drag to select the person you want to try on the garment
          </AlertDescription>
        </Alert>
      )}

      <div
        ref={containerRef}
        className="w-full bg-muted rounded-lg overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={isGroupPhoto ? "cursor-crosshair w-full" : "w-full"}
        />
        <img
          src={imageUrl}
          alt="Person"
          onLoad={handleImageLoad}
          className="hidden"
        />
      </div>

      {selection && isGroupPhoto && (
        <div className="text-xs text-muted-foreground">
          Selection: {selection.width.toFixed(0)}×{selection.height.toFixed(0)}px
        </div>
      )}
    </div>
  );
}
