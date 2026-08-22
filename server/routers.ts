import { COOKIE_NAME } from "@shared/const";
import type { StoreProduct } from "@shared/products";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createBundle,
  createStoreProduct,
  createNotificationsForAllUsers,
  createOrUpdateTestimonial,
  getProductBySlug,
  getProductsBySlugs,
  getNotificationPreferences,
  getTestimonialById,
  hasProductAccess,
  listAdminOrders,
  listAdminProducts,
  listAdminBundles,
  listAdminTestimonials,
  listApprovedTestimonials,
  listPublishedProducts,
  listPublishedBundles,
  listUserNotifications,
  listUserPurchases,
  listUserTestimonials,
  updateTestimonialStatus,
  updateStoreProduct,
  updateBundle,
  updateNotificationPreferences,
  markAllNotificationsRead,
  markNotificationRead,
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

const testimonialSubmissionInput = z.object({
  productId: z.string().trim().min(1).max(96),
  displayName: z.string().trim().min(2, "กรุณาระบุชื่อที่ต้องการแสดง").max(80),
  feedback: z.string().trim().min(30, "กรุณาเล่าประสบการณ์อย่างน้อย 30 ตัวอักษร").max(1200),
  consentToPublish: z.literal(true, { error: "ต้องยืนยันการอนุญาตก่อนส่ง" }),
});

const notificationBroadcastInput = z.object({
  title: z.string().trim().min(2).max(180),
  body: z.string().trim().min(2).max(600),
  href: z.string().trim().regex(/^\/(?!\/)/, "ลิงก์แจ้งเตือนต้องเป็น path ภายในเว็บไซต์").max(512),
});

const bundleInput = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug ต้องใช้ a-z, 0-9 และขีดกลางเท่านั้น").max(96),
  status: z.enum(["draft", "published", "archived"]),
  title: z.string().trim().min(2).max(220),
  subtitle: z.string().trim().max(255).nullable(),
  description: z.string().trim().min(10).max(5000),
  category: z.string().trim().min(2).max(120),
  coverUrl: z.string().trim().regex(/^(\/manus-storage\/|https:\/\/)/, "URL รูปปกไม่ถูกต้อง").max(1024),
  priceSatang: z.number().int().min(500, "ราคาต้องไม่น้อยกว่า 5 บาท").max(100000000),
  currency: z.literal("thb"),
  productIds: z.array(z.string().trim().min(1).max(96)).min(2, "Bundle ต้องมีอย่างน้อย 2 สินค้า").max(40),
}).superRefine((value, ctx) => {
  if (new Set(value.productIds).size !== value.productIds.length) ctx.addIssue({ code: "custom", message: "ไม่สามารถใส่สินค้าเดิมซ้ำใน Bundle", path: ["productIds"] });
});

async function validateBundleProducts(input: z.infer<typeof bundleInput>) {
  const products = await getProductsBySlugs(input.productIds);
  if (products.length !== input.productIds.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Bundle มีสินค้าที่ไม่พบในระบบ" });
  if (input.status === "published" && products.some((product) => product.status !== "published")) throw new TRPCError({ code: "BAD_REQUEST", message: "Bundle ที่เผยแพร่ต้องมีเฉพาะสินค้าที่เผยแพร่แล้ว" });
}

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
    list: publicProcedure.query(async () => {
      const [products, bundles] = await Promise.all([listPublishedProducts(), listPublishedBundles()]);
      return [...bundles, ...products.map(toPublicProduct)];
    }),
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
  testimonials: router({
    listApproved: publicProcedure.query(() => listApprovedTestimonials()),
    listMine: protectedProcedure.query(({ ctx }) => listUserTestimonials(ctx.user.id)),
    submit: protectedProcedure.input(testimonialSubmissionInput).mutation(async ({ ctx, input }) => {
      if (!consumeRateLimit("testimonial-submit", ctx.user.id, 6, 60 * 60_000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "ส่งเสียงสะท้อนบ่อยเกินไป กรุณาลองใหม่ภายหลัง" });
      if (!(await hasProductAccess(ctx.user.id, input.productId))) throw new TRPCError({ code: "FORBIDDEN", message: "ส่งเสียงสะท้อนได้เฉพาะสินค้าที่คุณซื้อแล้ว" });
      return createOrUpdateTestimonial({ userId: ctx.user.id, productId: input.productId, displayName: input.displayName, feedback: input.feedback });
    }),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => listUserNotifications(ctx.user.id)),
    preferences: protectedProcedure.query(({ ctx }) => getNotificationPreferences(ctx.user.id)),
    updatePreferences: protectedProcedure.input(z.object({ productEnabled: z.boolean(), purchaseEnabled: z.boolean(), systemEnabled: z.boolean() })).mutation(({ ctx, input }) => updateNotificationPreferences({ userId: ctx.user.id, ...input })),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => markNotificationRead({ userId: ctx.user.id, id: input.id })),
    markAllRead: protectedProcedure.mutation(({ ctx }) => markAllNotificationsRead(ctx.user.id)),
  }),
  admin: router({
    listProducts: adminProcedure.query(() => listAdminProducts()),
    listBundles: adminProcedure.query(() => listAdminBundles()),
    createBundle: adminProcedure.input(bundleInput).mutation(async ({ ctx, input }) => {
      if (!consumeRateLimit("admin-bundle", ctx.user.id, 20, 60_000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "บันทึก Bundle บ่อยเกินไป กรุณารอสักครู่" });
      await validateBundleProducts(input);
      try {
        const bundle = await createBundle({ ...input, createdBy: ctx.user.id });
        if (bundle?.status === "published") await createNotificationsForAllUsers({ kind: "product", title: "มีชุดใหม่บนกระดาน", body: bundle.title, href: `/#product-${bundle.slug}` });
        return bundle;
      } catch (error) {
        console.error("[Admin] Failed to create bundle", error);
        throw new TRPCError({ code: "CONFLICT", message: "ไม่สามารถสร้าง Bundle ได้ กรุณาตรวจสอบ slug" });
      }
    }),
    updateBundle: adminProcedure.input(z.object({ slug: z.string().min(1), bundle: bundleInput })).mutation(async ({ ctx, input }) => {
      if (!consumeRateLimit("admin-bundle", ctx.user.id, 20, 60_000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "บันทึก Bundle บ่อยเกินไป กรุณารอสักครู่" });
      if (input.slug !== input.bundle.slug) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่อนุญาตให้เปลี่ยน slug ของ Bundle" });
      await validateBundleProducts(input.bundle);
      const existing = (await listAdminBundles()).find((bundle) => bundle.slug === input.slug);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบ Bundle ที่ต้องการแก้ไข" });
      const bundle = await updateBundle(input.slug, input.bundle);
      if (existing.status !== "published" && bundle?.status === "published") await createNotificationsForAllUsers({ kind: "product", title: "มีชุดใหม่บนกระดาน", body: bundle.title, href: `/#product-${bundle.slug}` });
      return bundle;
    }),
    createProduct: adminProcedure.input(productInput).mutation(async ({ ctx, input }) => {
      if (!consumeRateLimit("admin-product", ctx.user.id, 30, 60_000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "บันทึกข้อมูลบ่อยเกินไป กรุณารอสักครู่" });
      try {
        const product = await createStoreProduct({ ...input, createdBy: ctx.user.id });
        if (product?.status === "published") await createNotificationsForAllUsers({ kind: "product", title: "มีหมากใหม่บนกระดาน", body: product.title, href: `/#product-${product.slug}` });
        return product;
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
      const product = await updateStoreProduct(input.slug, input.product);
      if (existing.status !== "published" && product?.status === "published") await createNotificationsForAllUsers({ kind: "product", title: "มีหมากใหม่บนกระดาน", body: product.title, href: `/#product-${product.slug}` });
      return product;
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
    listTestimonials: adminProcedure.query(() => listAdminTestimonials()),
    updateTestimonialStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["pending", "approved", "hidden", "rejected"]) })).mutation(async ({ ctx, input }) => {
      if (!consumeRateLimit("admin-testimonial", ctx.user.id, 40, 60_000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "อัปเดตสถานะบ่อยเกินไป กรุณารอสักครู่" });
      const testimonial = await getTestimonialById(input.id);
      if (!testimonial) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบเสียงสะท้อนที่ต้องการจัดการ" });
      if (input.status === "approved" && !testimonial.consentToPublish) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่สามารถอนุมัติข้อความที่ยังไม่ได้รับ consent" });
      return updateTestimonialStatus({ ...input, reviewedBy: ctx.user.id });
    }),
    broadcastNotification: adminProcedure.input(notificationBroadcastInput).mutation(async ({ ctx, input }) => {
      if (!consumeRateLimit("admin-notification", ctx.user.id, 12, 60 * 60_000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "ส่งข้อความบ่อยเกินไป กรุณาลองใหม่ภายหลัง" });
      return createNotificationsForAllUsers({ kind: "system", ...input });
    }),
  }),
});

export type AppRouter = typeof appRouter;
