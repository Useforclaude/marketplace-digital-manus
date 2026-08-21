import { COOKIE_NAME } from "@shared/const";
import type { StoreProduct } from "@shared/products";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createStoreProduct,
  getProductBySlug,
  hasProductAccess,
  listAdminOrders,
  listAdminProducts,
  listPublishedProducts,
  listUserPurchases,
  updateStoreProduct,
} from "./db";
import { parsePaidContent, toPublicProduct } from "./products";
import { createCheckoutSession } from "./stripe";
import { storagePut } from "./storage";
import { consumeRateLimit } from "./security";

const productInput = z
  .object({
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug ต้องใช้ a-z, 0-9 และขีดกลางเท่านั้น").max(96),
    productType: z.enum(["ebook", "course"]),
    status: z.enum(["draft", "published", "archived"]),
    title: z.string().trim().min(2).max(220),
    subtitle: z.string().trim().max(255).nullable(),
    description: z.string().trim().min(10).max(5000),
    category: z.string().trim().min(2).max(120),
    coverUrl: z.string().trim().regex(/^(\/manus-storage\/|https:\/\/)/, "URL รูปปกไม่ถูกต้อง").max(1024),
    coverKey: z.string().trim().max(512).nullable(),
    accent: z.enum(["lime", "violet", "rose", "cyan"]),
    priceSatang: z.number().int().min(500, "ราคาต้องไม่น้อยกว่า 5 บาท").max(100000000),
    currency: z.literal("thb"),
    unitCount: z.number().int().min(1).max(200),
    durationLabel: z.string().trim().min(2).max(80),
    content: z.string().trim().min(2).max(90000),
  })
  .superRefine((value, ctx) => {
    try {
      const content = JSON.parse(value.content) as Record<string, unknown>;
      if (content.kind !== value.productType) throw new Error("ชนิดเนื้อหาไม่ตรงกับประเภทสินค้า");
      if (value.productType === "ebook") {
        if (typeof content.intro !== "string" || !Array.isArray(content.chapters) || content.chapters.length < 1 || content.chapters.length > 100) throw new Error("eBook ต้องมีบทนำและอย่างน้อยหนึ่งบท");
      }
      if (value.productType === "course") {
        if (typeof content.intro !== "string" || !Array.isArray(content.modules) || content.modules.length < 1 || content.modules.length > 100) throw new Error("คอร์สต้องมีบทนำและอย่างน้อยหนึ่งโมดูล");
      }
    } catch (error) {
      ctx.addIssue({ code: "custom", message: error instanceof Error ? error.message : "รูปแบบเนื้อหาไม่ถูกต้อง", path: ["content"] });
    }
  });

const coverUploadInput = z.object({
  dataUrl: z.string().max(4300000),
  filename: z.string().trim().max(100).optional(),
});

function getCoverUpload(dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "รองรับเฉพาะไฟล์ PNG, JPG และ WebP" });
  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0 || buffer.length > 3 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "รูปปกต้องมีขนาดไม่เกิน 3 MB" });
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  return { buffer, contentType, extension };
}

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
    list: publicProcedure.query(async () => (await listPublishedProducts()).map(toPublicProduct)),
  }),
  commerce: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({ items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(5) })).min(1) }))
      .mutation(async ({ ctx, input }) => {
        if (!consumeRateLimit("checkout", ctx.user.id, 5, 60_000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "เริ่มชำระเงินบ่อยเกินไป กรุณาลองใหม่ในอีกสักครู่" });
        const host = ctx.req.get("host");
        const origin = ctx.req.get("origin") ?? (host ? `${ctx.req.protocol}://${host}` : undefined);
        if (!origin) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่พบที่อยู่สำหรับกลับสู่หน้าชำระเงิน" });

        try {
          return await createCheckoutSession({ user: ctx.user, items: input.items, origin });
        } catch (error) {
          console.error("[Checkout] Failed to create session", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "ไม่สามารถเริ่มการชำระเงินได้ กรุณาลองใหม่อีกครั้ง" });
        }
      }),
  }),
  library: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const purchases = await listUserPurchases(ctx.user.id);
      const library = await Promise.all(purchases.map(async (purchase) => {
        const product = await getProductBySlug(purchase.productId);
        return product ? { product: toPublicProduct(product), purchasedAt: purchase.purchasedAt } : null;
      }));
      return library.filter((item): item is { product: StoreProduct; purchasedAt: Date } => Boolean(item));
    }),
    reader: protectedProcedure
      .input(z.object({ productId: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        const product = await getProductBySlug(input.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบสินค้านี้" });
        if (!(await hasProductAccess(ctx.user.id, product.slug))) throw new TRPCError({ code: "FORBIDDEN", message: "ต้องซื้อสินค้านี้ก่อนจึงจะเปิดเนื้อหาได้" });
        return { product: toPublicProduct(product), content: parsePaidContent(product.content) };
      }),
  }),
  admin: router({
    listProducts: adminProcedure.query(() => listAdminProducts()),
    createProduct: adminProcedure.input(productInput).mutation(async ({ ctx, input }) => {
      if (!consumeRateLimit("admin-product", ctx.user.id, 30, 60_000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "บันทึกข้อมูลบ่อยเกินไป กรุณารอสักครู่" });
      try {
        return await createStoreProduct({ ...input, createdBy: ctx.user.id });
      } catch (error) {
        console.error("[Admin] Failed to create product", error);
        throw new TRPCError({ code: "CONFLICT", message: "ไม่สามารถสร้างสินค้าได้ กรุณาตรวจสอบ slug ว่าซ้ำหรือไม่" });
      }
    }),
    updateProduct: adminProcedure.input(z.object({ slug: z.string().min(1), product: productInput })).mutation(async ({ ctx, input }) => {
      if (!consumeRateLimit("admin-product", ctx.user.id, 30, 60_000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "บันทึกข้อมูลบ่อยเกินไป กรุณารอสักครู่" });
      if (input.slug !== input.product.slug) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่อนุญาตให้เปลี่ยน slug ของสินค้าที่มีอยู่" });
      const existing = await getProductBySlug(input.slug);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบสินค้าที่ต้องการแก้ไข" });
      return updateStoreProduct(input.slug, input.product);
    }),
    uploadCover: adminProcedure.input(coverUploadInput).mutation(async ({ ctx, input }) => {
      if (!consumeRateLimit("admin-upload", ctx.user.id, 12, 60_000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "อัปโหลดบ่อยเกินไป กรุณารอสักครู่" });
      const upload = getCoverUpload(input.dataUrl);
      try {
        return await storagePut(`product-covers/${ctx.user.id}/${Date.now()}.${upload.extension}`, upload.buffer, upload.contentType);
      } catch (error) {
        console.error("[Admin] Cover upload failed", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "ไม่สามารถอัปโหลดรูปปกได้" });
      }
    }),
    listOrders: adminProcedure.query(() => listAdminOrders()),
  }),
});

export type AppRouter = typeof appRouter;
