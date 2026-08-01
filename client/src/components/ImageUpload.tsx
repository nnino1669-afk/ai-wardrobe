import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void;
  preview?: string;
  label?: string;
  accept?: string;
  maxSize?: number; // in bytes
}

export function ImageUpload({
  onImageSelect,
  preview,
  label = "Upload Image",
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`Image must be smaller than ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    // Read and preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const previewUrl = event.target?.result as string;
      onImageSelect(file, previewUrl);
      toast.success("Image uploaded successfully");
    };
    reader.onerror = () => {
      toast.error("Failed to read image");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onImageSelect(null as any, "");
    toast.info("Image removed");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-2" htmlFor={`upload-${label}`}>
          {label}
        </label>
      )}

      {preview ? (
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted group ring-2 ring-transparent hover:ring-primary/50 transition-all">
          <img
            src={preview}
            alt={`${label} preview`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={() => inputRef.current?.click()}
              className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary"
              title="Change image"
              aria-label={`Change ${label.toLowerCase()}`}
            >
              <Upload className="w-5 h-5 text-black" />
            </button>
            <button
              onClick={handleClear}
              className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary"
              title="Remove image"
              aria-label={`Remove ${label.toLowerCase()}`}
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={dropZoneRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onKeyDown={handleKeyDown}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label={`Upload ${label.toLowerCase()} - drag and drop or click to select`}
          className={`w-full aspect-square rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary bg-muted/50"
          }`}
        >
          <Upload className="w-8 h-8 text-muted-foreground mb-2" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">
            Drag and drop or click
          </span>
          <span className="text-xs text-muted-foreground">
            JPG, PNG (max {maxSize / (1024 * 1024)}MB)
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        id={`upload-${label}`}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
