# AI Wardrobe - Virtual Mannequin App

## Phase 1: Clothing Catalog Database
- [ ] Create `garments` table schema (id, name, category, color, size, description, imageUrl, price)
- [ ] Create `categories` table (underkläder, tröjor, byxor, klänningar, kostym, etc.)
- [ ] Create `outfits` table to save user outfit combinations
- [ ] Create `wishlist` table for saved garments
- [ ] Generate and apply database migrations
- [ ] Create database helper functions for garment queries

## Phase 2: Catalog UI & Browsing
- [ ] Build CatalogBrowser component with category filtering
- [ ] Create GarmentCard component with image, name, price, size
- [ ] Implement search and filter functionality (category, color, size)
- [ ] Add sorting options (price, popularity, newest)
- [ ] Create detailed garment view modal
- [ ] Build responsive grid layout for mobile/tablet/desktop

## Phase 3: Virtual Try-On with Body Awareness
- [ ] Update TryOnStudio to use catalog garments instead of uploads
- [ ] Implement body detection for user's uploaded photo
- [ ] Create clothing fitting algorithm based on body proportions
- [ ] Integrate Hugging Face API for realistic garment placement
- [ ] Add try-on preview with before/after comparison
- [ ] Handle different clothing types (upper, lower, full outfit, etc.)

## Phase 4: Outfit Builder & Comparison
- [ ] Create OutfitBuilder component to combine multiple garments
- [ ] Build outfit preview showing complete look
- [ ] Implement save outfit functionality
- [ ] Create outfit history/gallery
- [ ] Add side-by-side outfit comparison
- [ ] Implement outfit sharing

## Phase 5: Wishlist & Advanced Features
- [ ] Build wishlist functionality (add/remove garments)
- [ ] Create wishlist view and management
- [ ] Add outfit recommendations based on user preferences
- [ ] Implement garment ratings and reviews
- [ ] Add price tracking and notifications
- [ ] Create user style profile

## Admin Features (Future)
- [ ] Admin panel for adding/editing garments
- [ ] Bulk upload for catalog
- [ ] Garment image optimization
- [ ] Analytics dashboard
