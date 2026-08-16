import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { createTryOn, getUserTryOns, deleteTryOn, getTryOnById, getGarmentCategories, getGarments, getGarmentById, getAdminGarments, createCatalogGarment, updateCatalogGarment, getAdminAnalytics, addToWishlist, removeFromWishlist, getUserWishlist, createOutfit, getUserOutfits, deleteOutfit, getGarmentReviews, saveGarmentReview, getStyleProfile, saveStyleProfile } from "./db";
import { generateVirtualTryOn } from "./vton";
import { resolveInferenceUrl, storageGetSignedUrl, storagePut } from "./storage";
import { cropSelectedPerson } from "./personCrop";
import { analyzePersonImage } from "./bodyAware";
import { optimizeUploadedImage } from "./imageOptimization";
import { prepareBodyAwareInferenceImage } from "./bodyFitPreprocess";
import { analyzePersonForLock } from "./personLockAnalysis";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  tryOn: router({
    create: protectedProcedure
      .input(
        z.object({
          personImageUrl: z.string().url(),
          garmentImageUrl: z.string().url(),
          resultImageUrl: z.string().url(),
          clothType: z.enum(["upper", "lower", "overall", "inner", "outer"]),
          name: z.string().optional(),
          personSelector: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const tryOn = await createTryOn({
          userId: ctx.user.id,
          ...input,
        });
        return tryOn;
      }),

    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const tryOns = await getUserTryOns(ctx.user.id, input.limit, input.offset);
        return tryOns;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership before deleting
        const tryOn = await getTryOnById(input.id);
        if (!tryOn || tryOn.userId !== ctx.user.id) {
          return { success: false, error: "Not authorized to delete this try-on" };
        }
        const success = await deleteTryOn(input.id);
        return { success };
      }),

    uploadImage: protectedProcedure
      .input(
        z.object({
          imageData: z.string(), // base64 data URL
          imageType: z.enum(["person", "garment"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Extract base64 from data URL
          const matches = input.imageData.match(/^data:image\/(\w+);base64,(.+)$/);
          if (!matches) {
            return {
              success: false,
              error: "Invalid image data format",
            };
          }

          const [, format, base64] = matches;
          const buffer = Buffer.from(base64, "base64");
          const optimized = await optimizeUploadedImage(buffer, format);

          // Upload the normalized image to S3
          let personLockProfile = undefined;
          if (input.imageType === "person") {
            personLockProfile = await analyzePersonForLock(optimized.buffer);
          }

          const uploadResult = await storagePut(
            `input-images/${ctx.user.id}/${input.imageType}/${Date.now()}.${optimized.format}`,
            optimized.buffer,
            optimized.contentType,
          );
          const inferenceUrl = await storageGetSignedUrl(uploadResult.key);

          return {
            success: true,
            imageUrl: uploadResult.url,
            inferenceUrl,
            personLockProfile,
          };
        } catch (error) {
          console.error("[TryOn] Error uploading image:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to upload image",
          };
        }
      }),

    process: protectedProcedure
      .input(
        z.object({
          personImageUrl: z.string().min(1),
          garmentImageUrl: z.string().min(1),
          clothType: z.enum(["upper", "lower", "overall", "inner", "outer"]),
          model: z.enum(["idmvton", "catvton"]).default("idmvton"),
          personSelector: z.string().optional(),
          bodyFitPlan: z.object({
            confidence: z.number().min(0).max(1),
            bodyBox: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), width: z.number().min(0).max(1), height: z.number().min(0).max(1) }),
            shoulderWidth: z.number().min(0).max(1),
            hipWidth: z.number().min(0).max(1),
            torsoRatio: z.number().positive(),
            fitScale: z.number().min(0.5).max(1.5),
            verticalAnchor: z.number().min(0).max(1),
            detectedAt: z.number().int().positive(),
          }).optional(),
          name: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const personImageUrl = await resolveInferenceUrl(input.personImageUrl);
          const garmentImageUrl = await resolveInferenceUrl(input.garmentImageUrl);
          const selectedPersonImage = input.personSelector
            ? await cropSelectedPerson(personImageUrl, input.personSelector, ctx.user.id)
            : null;
          const effectivePersonImageUrl = selectedPersonImage?.inferenceUrl || personImageUrl;
          const inferencePersonImageUrl = input.bodyFitPlan && !selectedPersonImage
            ? await prepareBodyAwareInferenceImage(effectivePersonImageUrl, input.bodyFitPlan, ctx.user.id)
            : effectivePersonImageUrl;
          const fitProfile = await analyzePersonImage(
            inferencePersonImageUrl,
            selectedPersonImage ? { x: 0, y: 0, width: 1, height: 1 } : undefined,
          );

          // Extract person lock profile if available
          const personLockProfile = await analyzePersonForLock(
            Buffer.from(await (await fetch(inferencePersonImageUrl)).arrayBuffer()),
          ).catch(() => undefined);

          // Call Hugging Face API to generate virtual try-on with strict identity lock
          const vtonResult = await generateVirtualTryOn({
            personImageUrl: inferencePersonImageUrl,
            garmentImageUrl,
            clothType: input.clothType,
            model: input.model,
            fitProfile,
            bodyFitPlan: input.bodyFitPlan,
            personLockProfile,
          });

          if (!vtonResult.success || !vtonResult.imageUrl) {
            return {
              success: false,
              error: vtonResult.error || "Failed to generate virtual try-on",
            };
          }

          // Convert data URL to buffer for S3 upload
          let resultBuffer: Buffer;
          if (vtonResult.imageUrl.startsWith("data:image")) {
            // Extract base64 from data URL
            const base64 = vtonResult.imageUrl.split(",")[1];
            resultBuffer = Buffer.from(base64, "base64");
          } else {
            // If it's a URL, fetch and convert
            const response = await fetch(vtonResult.imageUrl);
            resultBuffer = Buffer.from(await response.arrayBuffer());
          }

          // Upload result to S3
          const uploadResult = await storagePut(
            `try-on-results/${ctx.user.id}/${Date.now()}.png`,
            resultBuffer,
            "image/png"
          );

          // Save to database
          const tryOn = await createTryOn({
            userId: ctx.user.id,
            personImageUrl,
            garmentImageUrl,
            resultImageUrl: uploadResult.url,
            clothType: input.clothType,
            personSelector: input.personSelector,
            name: input.name,
          });

          return {
            success: true,
            tryOn,
            resultImageUrl: uploadResult.url,
            effectivePersonImageUrl,
          };
        } catch (error) {
          console.error("[TryOn] Error processing virtual try-on:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }),
  }),

  catalog: router({
    categories: publicProcedure.query(async () => {
      return await getGarmentCategories();
    }),

    garments: publicProcedure
      .input(
        z.object({
          categoryId: z.number().optional(),
          clothType: z.enum(["upper", "lower", "overall", "inner", "outer"]).optional(),
          sort: z.enum(["newest", "priceAsc", "priceDesc", "popularity"]).default("newest"),
        })
      )
      .query(async ({ input }) => {
        return await getGarments(input.categoryId, input.clothType, input.sort);
      }),

    garmentDetail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getGarmentById(input.id);
      }),
  }),

  outfits: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserOutfits(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(255),
          description: z.string().trim().max(1000).optional(),
          garmentIds: z.array(z.number().int().positive()).min(1).max(20),
          previewImageUrl: z.string().url().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return await createOutfit({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          garmentIds: JSON.stringify(input.garmentIds),
          previewImageUrl: input.previewImageUrl,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        return { success: await deleteOutfit(input.id, ctx.user.id) };
      }),
  }),

  admin: router({
    analytics: adminProcedure.query(async () => getAdminAnalytics()),
    garments: adminProcedure.query(async () => getAdminGarments()),
    createGarment: adminProcedure
      .input(z.object({ categoryId: z.number().int().positive(), name: z.string().trim().min(1).max(255), description: z.string().trim().max(2000).optional(), imageUrl: z.string().min(1), clothType: z.enum(["upper", "lower", "overall", "inner", "outer"]), color: z.string().trim().max(50).optional(), sizes: z.string().trim().max(100).optional(), price: z.number().int().nonnegative().optional(), brand: z.string().trim().max(100).optional() }))
      .mutation(async ({ input }) => ({ success: await createCatalogGarment({ ...input, isActive: 1 }) })),
    updateGarment: adminProcedure
      .input(z.object({ id: z.number().int().positive(), patch: z.object({ name: z.string().trim().min(1).max(255).optional(), description: z.string().trim().max(2000).optional(), imageUrl: z.string().min(1).optional(), color: z.string().trim().max(50).optional(), sizes: z.string().trim().max(100).optional(), price: z.number().int().nonnegative().optional(), brand: z.string().trim().max(100).optional(), isActive: z.number().int().min(0).max(1).optional() }) }))
      .mutation(async ({ input }) => ({ success: await updateCatalogGarment(input.id, input.patch) })),
    bulkImport: adminProcedure
      .input(z.object({ garments: z.array(z.object({ categoryId: z.number().int().positive(), name: z.string().trim().min(1).max(255), description: z.string().trim().max(2000).optional(), imageUrl: z.string().min(1), clothType: z.enum(["upper", "lower", "overall", "inner", "outer"]), color: z.string().trim().max(50).optional(), sizes: z.string().trim().max(100).optional(), price: z.number().int().nonnegative().optional(), brand: z.string().trim().max(100).optional() })).max(500) }))
      .mutation(async ({ input }) => { for (const garment of input.garments) await createCatalogGarment({ ...garment, isActive: 1 }); return { success: true, imported: input.garments.length }; }),
  }),

  styleProfile: router({
    get: protectedProcedure.query(async ({ ctx }) => getStyleProfile(ctx.user.id)),
    save: protectedProcedure
      .input(z.object({ preferredColor: z.string().trim().max(50), preferredFit: z.enum(["relaxed", "regular", "tailored"]), preferredOccasion: z.enum(["everyday", "work", "evening", "active"]) }))
      .mutation(async ({ ctx, input }) => ({ success: await saveStyleProfile(ctx.user.id, input) })),
  }),

  reviews: router({
    list: publicProcedure
      .input(z.object({ garmentId: z.number().int().positive() }))
      .query(async ({ input }) => getGarmentReviews(input.garmentId)),

    save: protectedProcedure
      .input(z.object({ garmentId: z.number().int().positive(), rating: z.number().int().min(1).max(5), review: z.string().trim().max(1000).optional() }))
      .mutation(async ({ ctx, input }) => ({ success: await saveGarmentReview(ctx.user.id, input.garmentId, input.rating, input.review) })),
  }),

  wishlist: router({
    add: protectedProcedure
      .input(z.object({ garmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await addToWishlist(ctx.user.id, input.garmentId);
        return { success };
      }),

    remove: protectedProcedure
      .input(z.object({ garmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await removeFromWishlist(ctx.user.id, input.garmentId);
        return { success };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
        return await getUserWishlist(ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
