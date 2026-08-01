import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trash2, Download, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function History() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  // Fetch try-on history
  const { data: tryOns, isLoading, refetch } = trpc.tryOn.list.useQuery({
    limit: 50,
    offset: 0,
  });

  // Delete mutation
  const deleteMutation = trpc.tryOn.delete.useMutation({
    onSuccess: () => {
      toast.success("Try-on deleted");
      refetch();
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete try-on");
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `ai-wardrobe-${index}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded!");
  };

  const clothTypeLabels: Record<string, string> = {
    upper: "Upper Body",
    lower: "Lower Body",
    overall: "Full Outfit",
    inner: "Inner Layer",
    outer: "Outer Layer",
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
              onClick={() => setLocation("/studio")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Try-On History</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !tryOns || tryOns.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-12 h-12 rounded-lg bg-muted-foreground/10 flex items-center justify-center mx-auto mb-4">
              <Download className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No try-ons yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first virtual try-on to see it here
            </p>
            <Button onClick={() => setLocation("/studio")}>
              Go to Studio
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tryOns.map((tryOn, index) => (
              <Card key={tryOn.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Result Image */}
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={tryOn.resultImageUrl}
                    alt={tryOn.name || "Try-on result"}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  {tryOn.name && (
                    <h3 className="font-semibold truncate">{tryOn.name}</h3>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">
                        {clothTypeLabels[tryOn.clothType] || tryOn.clothType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">
                        {new Date(tryOn.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDownload(tryOn.resultImageUrl, index)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(tryOn.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Try-On?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The try-on result will be permanently deleted.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
