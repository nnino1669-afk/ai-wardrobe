import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { createTryOn, getUserTryOns, deleteTryOn, getTryOnById } from "./db";
import { generateVirtualTryOn } from "./vton";
import { storagePut } from "./storage";

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

    process: protectedProcedure
      .input(
        z.object({
          personImageUrl: z.string().url(),
          garmentImageUrl: z.string().url(),
          clothType: z.enum(["upper", "lower", "overall", "inner", "outer"]),
          personSelector: z.string().optional(),
          name: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Call Hugging Face API to generate virtual try-on
          const vtonResult = await generateVirtualTryOn({
            personImageUrl: input.personImageUrl,
            garmentImageUrl: input.garmentImageUrl,
            clothType: input.clothType,
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
            personImageUrl: input.personImageUrl,
            garmentImageUrl: input.garmentImageUrl,
            resultImageUrl: uploadResult.url,
            clothType: input.clothType,
            personSelector: input.personSelector,
            name: input.name,
          });

          return {
            success: true,
            tryOn,
            resultImageUrl: uploadResult.url,
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
});

export type AppRouter = typeof appRouter;
