# AI Wardrobe - Virtual Mannequin App

## Phase 1: Clothing Catalog Database
- [x] Create `garments` table schema (id, name, category, color, size, description, imageUrl, price)
- [x] Create `categories` table (underkläder, tröjor, byxor, klänningar, kostym, etc.)
- [x] Create `outfits` table to save user outfit combinations
- [x] Create `wishlist` table for saved garments
- [x] Generate and apply database migrations
- [x] Create database helper functions for garment queries

## Phase 2: Catalog UI & Browsing
- [x] Build CatalogBrowser component with category filtering
- [x] Create GarmentCard component with image, name, price, size
- [x] Implement category and cloth-type filtering functionality
- [x] Add sorting options (price, popularity, newest)
- [x] Create detailed garment view modal
- [x] Build responsive grid layout for mobile/tablet/desktop

## Phase 3: Virtual Try-On with Body Awareness
- [x] Update TryOnStudio to use catalog garments instead of uploads
- [ ] Implement body detection for user's uploaded photo
- [ ] Create clothing fitting algorithm based on body proportions
- [x] Integrate Hugging Face API for realistic garment placement
- [x] Add try-on preview with before/after comparison
- [x] Handle different clothing types (upper, lower, full outfit, inner, and outer)

## Phase 4: Outfit Builder & Comparison
- [x] Create OutfitBuilder component to combine multiple garments
- [x] Build outfit preview showing complete look
- [x] Implement save outfit functionality
- [x] Create outfit history/gallery
- [x] Add side-by-side outfit comparison
- [x] Implement outfit sharing

## Phase 5: Wishlist & Advanced Features
- [x] Build wishlist functionality (add/remove garments)
- [x] Create wishlist view and management
- [x] Add outfit recommendations based on user preferences
- [x] Implement garment ratings and reviews
- [x] Add price tracking and notifications
- [x] Create user style profile

## Admin Features
- [x] Admin panel for adding/editing garments
- [x] Bulk upload for catalog
- [x] Garment image optimization
- [x] Analytics dashboard


## Phase 1: React Stability Fix
- [x] Remove all state updates performed during render in catalog components
- [x] Stabilize catalog query inputs and mutation invalidation behavior
- [x] Add a regression test or deterministic verification for the catalog rendering path
- [x] Run TypeScript checks and browser visual QA after the fix

## Phase 2: Catalog-to-Studio Integration
- [x] Replace manual garment upload as the primary flow with catalog garment selection
- [x] Preserve user photo upload as the mannequin/person source
- [x] Show the selected catalog garment and allow changing it before processing
- [x] Verify the studio works with an empty catalog and loading/error states

## Phase 3: Body-Aware Try-On Fidelity
- [x] Send catalog garment image URLs through the existing inference pipeline
- [x] Preserve person identity, pose, proportions, and background in the result flow
- [x] Handle upper, lower, inner, outer, and full-outfit garment categories
- [x] Document current model limitations and unsupported guarantees honestly

## Phase 4: Outfit Workflow
- [ ] Support selecting more than one compatible garment for an outfit
- [ ] Save and reload outfit combinations for the current user
- [ ] Compare generated looks side by side

## Phase 5: Final QA
- [ ] Run all Vitest tests and TypeScript checks
- [ ] Verify studio, catalog, history, help, and sharing routes visually
- [ ] Save a stable checkpoint after the fixes are verified
- [ ] Mark completed work accurately in todo.md

Previous catalog work remains tracked above and is not removed.


## Catalog QA Follow-up
- [x] Display available garment sizes in GarmentCard
- [x] Add explicit loading, empty, and error states for catalog and category queries
- [x] Add deterministic regression coverage for catalog query error and empty states
- [x] Re-run visual QA after the catalog resilience fixes
- [x] Add an explicit regression assertion for the catalog empty-state message


## Phase 3: Model and Fidelity Controls
- [x] Add an explicit IDM-VTON/CatVTON selector to the studio
- [x] Pass the selected model through the tRPC processing contract
- [x] Explain that virtual try-on is a visual estimate, not a guaranteed physical fit
- [x] Add regression coverage for model selection and adapter routing


## Phase 3: Fidelity Verification Follow-up
- [x] Add an explicit backend person-region contract for group-photo selection
- [x] Add deterministic validation for the selected person region before inference
- [x] Make cloth-type handling explicit in the active model adapter or reject unsupported combinations clearly
- [x] Add regression coverage for all supported cloth types and group-photo selection


## Phase 4: Outfit Builder
- [x] Add server helpers and procedures for saving user outfits
- [x] Build an outfit builder that can collect selected catalog garments
- [x] Show a saved-look summary with garment categories
- [x] Add outfit list loading and ownership-safe deletion
- [x] Add regression coverage for outfit persistence contracts


## Outfit Summary Follow-up
- [x] Resolve saved outfit garment IDs to catalog metadata when rendering saved looks
- [x] Display saved outfit clothing categories/types, not only piece count
- [x] Add regression coverage for the saved-category summary contract


## Phase 4: History Comparison Follow-up
- [x] Move History authentication redirect into an effect
- [x] Add selection controls for comparing generated try-on results
- [x] Render a side-by-side comparison panel for selected results
- [x] Add regression coverage for history redirect and comparison selection
- [x] Keep History query and mutation hooks unconditional while authentication state resolves


## History Auth Resolution Follow-up
- [x] Defer History redirect until auth loading has completed
- [x] Gate history queries on resolved authentication state
- [x] Add regression coverage for the loading-state auth path


## Invalid Person Image URL Fix
- [x] Trace where the uploaded person image URL becomes invalid before inference
- [x] Normalize relative storage URLs into absolute URLs on the server
- [x] Validate person and garment URLs before calling the VTON adapter
- [x] Add regression tests for relative, absolute, and invalid image URLs
- [x] Re-run the full test suite and visual QA
- [ ] Save a corrected checkpoint
