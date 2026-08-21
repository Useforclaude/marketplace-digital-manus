import { COOKIE_NAME } from "@shared/const";
import { findProduct, products } from "@shared/products";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { hasProductAccess, listUserPurchases } from "./db";
import { readerEditions } from "./ebookContent";
import { createCheckoutSession } from "./stripe";

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
  catalog: router({
    list: publicProcedure.query(() => products),
  }),
  commerce: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({ items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(5) })).min(1) }))
      .mutation(async ({ ctx, input }) => {
        const host = ctx.req.get("host");
        const origin = ctx.req.get("origin") ?? (host ? `${ctx.req.protocol}://${host}` : undefined);
        if (!origin) throw new TRPCError({ code: "BAD_REQUEST", message: "Unable to determine checkout origin." });

        try {
          return await createCheckoutSession({ user: ctx.user, items: input.items, origin });
        } catch (error) {
          console.error("[Checkout] Failed to create session", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to start checkout. Please try again." });
        }
      }),
  }),
  library: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const purchases = await listUserPurchases(ctx.user.id);
      return purchases
        .map((purchase) => {
          const product = findProduct(purchase.productId);
          return product ? { product, purchasedAt: purchase.purchasedAt } : null;
        })
        .filter((purchase): purchase is { product: NonNullable<ReturnType<typeof findProduct>>; purchasedAt: Date } => Boolean(purchase));
    }),
    reader: protectedProcedure
      .input(z.object({ productId: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        const product = findProduct(input.productId);
        if (!product || !readerEditions[input.productId]) throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found." });
        if (!(await hasProductAccess(ctx.user.id, product.id))) throw new TRPCError({ code: "FORBIDDEN", message: "Purchase required." });
        return { product, edition: readerEditions[product.id] };
      }),
  }),
});

export type AppRouter = typeof appRouter;
