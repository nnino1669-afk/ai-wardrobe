import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Heart, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PriceAlertButton } from "@/components/PriceAlertButton";

interface GarmentCardProps {
  garment: any;
  onSelect: (garment: any) => void;
  isInWishlist: boolean;
  onWishlistToggle: (garmentId: number) => void;
  onOpenDetails: (garment: any) => void;
}

function GarmentCard({ garment, onSelect, isInWishlist, onWishlistToggle, onOpenDetails }: GarmentCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={garment.imageUrl}
          alt={garment.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onWishlistToggle(garment.id);
          }}
          className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
            isInWishlist
              ? "bg-red-500 text-white"
              : "bg-white/80 text-gray-600 hover:bg-white"
          }`}
        >
          <Heart className="w-5 h-5" fill={isInWishlist ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold truncate">{garment.name}</h3>
          {garment.brand && (
            <p className="text-sm text-muted-foreground">{garment.brand}</p>
          )}
        </div>

        {/* Details */}
        <div className="space-y-1 text-sm">
          {garment.color && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Color:</span>
              <span className="font-medium">{garment.color}</span>
            </div>
          )}
          {garment.sizes && (
            <div className="flex items-start justify-between gap-2">
              <span className="text-muted-foreground shrink-0">Sizes:</span>
              <span className="font-medium text-right text-xs leading-4 break-words">{garment.sizes}</span>
            </div>
          )}
          {garment.price && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-semibold">${(garment.price / 100).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Select Button */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => onOpenDetails(garment)} variant="outline">
            Details
          </Button>
          <Button onClick={() => onSelect(garment)} variant="default">
            Try On
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface CatalogBrowserProps {
  onGarmentSelect: (garment: any) => void;
  clothType?: string;
}

export function CatalogBrowser({ onGarmentSelect, clothType }: CatalogBrowserProps) {
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [selectedClothType, setSelectedClothType] = useState<string | undefined>(clothType);
  const [selectedSort, setSelectedSort] = useState<"newest" | "priceAsc" | "priceDesc" | "popularity">("newest");
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [detailGarment, setDetailGarment] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewText, setReviewText] = useState("");
  const utils = trpc.useUtils();

  useEffect(() => {
    setSelectedClothType(clothType);
  }, [clothType]);

  useEffect(() => {
    setReviewRating("5");
    setReviewText("");
  }, [detailGarment?.id]);

  const catalogInput = useMemo(
    () => ({
      categoryId: selectedCategory,
      clothType: selectedClothType as "upper" | "lower" | "overall" | "inner" | "outer" | undefined,
      sort: selectedSort,
    }),
    [selectedCategory, selectedClothType, selectedSort],
  );

  // Fetch categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = trpc.catalog.categories.useQuery();

  // Fetch garments with a stable input object
  const {
    data: garments,
    isLoading: garmentsLoading,
    error: garmentsError,
  } = trpc.catalog.garments.useQuery(catalogInput);

  // Wishlist is protected, so do not request it before authentication is known.
  const { data: styleProfile } = trpc.styleProfile.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const reviewInput = useMemo(() => ({ garmentId: detailGarment?.id ?? 0 }), [detailGarment?.id]);
  const { data: reviews = [], isLoading: reviewsLoading, error: reviewsError, refetch: refetchReviews } = trpc.reviews.list.useQuery(reviewInput, { enabled: Boolean(detailGarment), retry: false });
  const saveReviewMutation = trpc.reviews.save.useMutation({
    onSuccess: async () => {
      const result = await refetchReviews();
      const nextReviews = result.data ?? [];
      const average = nextReviews.length > 0 ? nextReviews.reduce((sum, item) => sum + item.rating, 0) / nextReviews.length : 0;
      setDetailGarment((current: any | null) => current ? { ...current, rating: Math.round(average * 100), reviewCount: nextReviews.length } : current);
      setReviewText("");
      toast.success("Your review was saved");
    },
    onError: () => toast.error("Could not save your review"),
  });

  const { data: wishlist = [] } = trpc.wishlist.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const wishlistIds = useMemo(() => new Set(wishlist.map((g: any) => g.id)), [wishlist]);

  // Wishlist mutations
  const addWishlistMutation = trpc.wishlist.add.useMutation({
    onSuccess: async () => {
      await utils.wishlist.list.invalidate();
      toast.success("Added to wishlist");
    },
    onError: () => toast.error("Could not add garment to wishlist"),
  });

  const removeWishlistMutation = trpc.wishlist.remove.useMutation({
    onSuccess: async () => {
      await utils.wishlist.list.invalidate();
      toast.success("Removed from wishlist");
    },
    onError: () => toast.error("Could not remove garment from wishlist"),
  });

  const visibleGarments = useMemo(
    () => showWishlistOnly ? (garments ?? []).filter((garment) => wishlistIds.has(garment.id)) : (garments ?? []),
    [garments, showWishlistOnly, wishlistIds],
  );
  const recommendations = useMemo(() => {
    const preferredColor = styleProfile?.preferredColor.trim().toLowerCase();
    return (garments ?? []).filter((garment) => {
      const color = garment.color?.toLowerCase() ?? "";
      const matchesProfile = Boolean(preferredColor && color.includes(preferredColor));
      const matchesWishlist = Boolean(garment.color && wishlist.some((saved: any) => saved.color === garment.color));
      return matchesProfile || matchesWishlist;
    }).slice(0, 3);
  }, [garments, wishlist, styleProfile?.preferredColor]);

  const handleReviewSubmit = () => {
    if (!detailGarment) return;
    saveReviewMutation.mutate({ garmentId: detailGarment.id, rating: Number(reviewRating), review: reviewText.trim() || undefined });
  };

  const handleWishlistToggle = (garmentId: number) => {
    if (wishlistIds.has(garmentId)) {
      removeWishlistMutation.mutate({ garmentId });
    } else {
      addWishlistMutation.mutate({ garmentId });
    }
  };

  const clothTypes = [
    { value: "upper", label: "Tops" },
    { value: "lower", label: "Bottoms" },
    { value: "overall", label: "Dresses" },
    { value: "inner", label: "Underwear" },
    { value: "outer", label: "Outerwear" },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        {/* Cloth Type Filter */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Clothing Type</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedClothType === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedClothType(undefined)}
            >
              All
            </Button>
            {clothTypes.map((type) => (
              <Button
                key={type.value}
                variant={selectedClothType === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedClothType(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold mb-2">Sort garments</h3>
            <select
              value={selectedSort}
              onChange={(event) => setSelectedSort(event.target.value as typeof selectedSort)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Sort garments"
            >
              <option value="newest">Newest</option>
              <option value="popularity">Popularity</option>
              <option value="priceAsc">Price: low to high</option>
              <option value="priceDesc">Price: high to low</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={showWishlistOnly ? "default" : "outline"} size="sm" onClick={() => setShowWishlistOnly((current) => !current)} disabled={!isAuthenticated}>
            {showWishlistOnly ? "Showing wishlist" : "Show wishlist"}
          </Button>
        </div>

        {/* Category Filter */}
        {categoriesLoading ? (
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        ) : categoriesError ? (
          <Card className="p-4 border-destructive/30 bg-destructive/5">
            <p className="text-sm text-destructive">Categories could not be loaded. You can still browse all garments.</p>
          </Card>
        ) : categories && categories.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold mb-2">Category</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(undefined)}
              >
                All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {recommendations.length > 0 && !showWishlistOnly && (
        <Card className="p-4 bg-accent/5 border-accent/20">
          <p className="font-medium">Recommended for your style</p>
          <p className="text-xs text-muted-foreground mt-1">These pieces match your saved colors or account style preferences. No ratings or reviews are fabricated.</p>
          <div className="mt-3 flex flex-wrap gap-2">{recommendations.map((garment) => <Button key={garment.id} variant="outline" size="sm" onClick={() => onGarmentSelect(garment)}>{garment.name}</Button>)}</div>
        </Card>
      )}

      {/* Garments Grid */}
      {garmentsError ? (
        <Card className="p-8 text-center border-destructive/30 bg-destructive/5">
          <p className="font-medium text-destructive">The garment catalog could not be loaded.</p>
          <p className="text-sm text-muted-foreground mt-1">Please try again in a moment.</p>
        </Card>
      ) : garmentsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : visibleGarments.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">{showWishlistOnly ? "Your wishlist is empty" : "No garments found in this category"}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleGarments.map((garment) => (
            <GarmentCard
              key={garment.id}
              garment={garment}
              onSelect={onGarmentSelect}
              isInWishlist={wishlistIds.has(garment.id)}
              onWishlistToggle={handleWishlistToggle}
              onOpenDetails={setDetailGarment}
            />
          ))}
        </div>
      )}

      <Dialog open={Boolean(detailGarment)} onOpenChange={(open) => !open && setDetailGarment(null)}>
        <DialogContent className="max-w-2xl">
          {detailGarment && (
            <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                <img src={detailGarment.imageUrl} alt={detailGarment.name} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="text-2xl">{detailGarment.name}</DialogTitle>
                  <DialogDescription>{detailGarment.brand || "Catalog garment"}</DialogDescription>
                </DialogHeader>
                {detailGarment.description && <p className="text-sm leading-6 text-muted-foreground">{detailGarment.description}</p>}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {detailGarment.color && <div><span className="text-muted-foreground">Color</span><p className="font-medium">{detailGarment.color}</p></div>}
                  {detailGarment.sizes && <div><span className="text-muted-foreground">Available sizes</span><p className="font-medium">{detailGarment.sizes}</p></div>}
                  {detailGarment.price != null && <div><span className="text-muted-foreground">Price</span><p className="font-semibold">${(detailGarment.price / 100).toFixed(2)}</p></div>}
                  <div>
                    <span className="text-muted-foreground">Community rating</span>
                    {detailGarment.reviewCount > 0 ? (
                      <p className="flex items-center gap-1 font-medium"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {(detailGarment.rating / 100).toFixed(1)} ({detailGarment.reviewCount})</p>
                    ) : <p className="font-medium">No ratings yet</p>}
                  </div>
                </div>
                <PriceAlertButton garmentId={detailGarment.id} currentPrice={detailGarment.price} />
                <div className="space-y-3 rounded-lg border border-border p-3">
                  <div><p className="text-sm font-medium">Reviews</p><p className="text-xs text-muted-foreground">Only reviews submitted by users are shown.</p></div>
                  {reviewsLoading ? <p className="text-sm text-muted-foreground">Loading reviews...</p> : reviewsError ? <p className="text-sm text-destructive">Reviews could not be loaded.</p> : reviews.length === 0 ? <p className="text-sm text-muted-foreground">No reviews yet.</p> : <div className="space-y-2">{reviews.slice(0, 3).map((review) => <div key={review.id} className="rounded border border-border/70 p-2"><p className="text-sm">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>{review.review && <p className="text-sm text-muted-foreground">{review.review}</p>}</div>)}</div>}
                  {isAuthenticated && <div className="space-y-2 border-t border-border pt-3"><select value={reviewRating} onChange={(event) => setReviewRating(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm" aria-label="Review rating"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select><Textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} maxLength={1000} placeholder="Share an honest note about this garment" aria-label="Review text" /><Button variant="outline" onClick={handleReviewSubmit} disabled={saveReviewMutation.isPending}>Save review</Button></div>}
                </div>
                <Button className="w-full" onClick={() => { onGarmentSelect(detailGarment); setDetailGarment(null); }}>
                  Try this garment on
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
