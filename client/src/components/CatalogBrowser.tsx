import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface GarmentCardProps {
  garment: any;
  onSelect: (garment: any) => void;
  isInWishlist: boolean;
  onWishlistToggle: (garmentId: number) => void;
}

function GarmentCard({ garment, onSelect, isInWishlist, onWishlistToggle }: GarmentCardProps) {
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
        <Button
          onClick={() => onSelect(garment)}
          className="w-full"
          variant="default"
        >
          Try On
        </Button>
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
  const utils = trpc.useUtils();

  useEffect(() => {
    setSelectedClothType(clothType);
  }, [clothType]);

  const catalogInput = useMemo(
    () => ({
      categoryId: selectedCategory,
      clothType: selectedClothType as "upper" | "lower" | "overall" | "inner" | "outer" | undefined,
    }),
    [selectedCategory, selectedClothType],
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
  const { data: wishlist = [] } = trpc.wishlist.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const wishlistIds = new Set(wishlist.map((g: any) => g.id));

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
      ) : !garments || garments.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No garments found in this category</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {garments.map((garment) => (
            <GarmentCard
              key={garment.id}
              garment={garment}
              onSelect={onGarmentSelect}
              isInWishlist={wishlistIds.has(garment.id)}
              onWishlistToggle={handleWishlistToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
