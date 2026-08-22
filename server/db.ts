import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { bundles, bundleItems, checkoutOffers, InsertStoreProduct, InsertUser, notificationPreferences, notifications, purchases, storeProducts, testimonials, users } from "../drizzle/schema";
import { defaultProducts } from "./defaultProducts";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function ensureDefaultProducts() {
  const db = await getDb();
  if (!db) return;
  await db.insert(storeProducts).values(defaultProducts).onDuplicateKeyUpdate({ set: { slug: sql`slug` } });
}

export async function listPublishedProducts() {
  await ensureDefaultProducts();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(storeProducts).where(eq(storeProducts.status, "published")).orderBy(desc(storeProducts.createdAt));
}

type BundleInput = {
  slug: string;
  status: "draft" | "published" | "archived";
  title: string;
  subtitle: string | null;
  description: string;
  category: string;
  coverUrl: string;
  priceSatang: number;
  currency: "thb";
  productIds: string[];
};

async function attachBundleItems(sourceBundles: (typeof bundles.$inferSelect)[]) {
  const db = await getDb();
  if (!db || sourceBundles.length === 0) return [] as ((typeof bundles.$inferSelect) & { productType: "bundle"; accent: "lime"; unitCount: number; durationLabel: string; includedProductIds: string[] })[];
  const items = await db.select().from(bundleItems).where(inArray(bundleItems.bundleSlug, sourceBundles.map((bundle) => bundle.slug)));
  const byBundle = new Map<string, string[]>();
  items.forEach((item) => byBundle.set(item.bundleSlug, [...(byBundle.get(item.bundleSlug) ?? []), item.productId]));
  return sourceBundles.map((bundle) => {
    const includedProductIds = byBundle.get(bundle.slug) ?? [];
    return { ...bundle, productType: "bundle" as const, accent: "lime" as const, unitCount: includedProductIds.length, durationLabel: `${includedProductIds.length} รายการ`, includedProductIds };
  });
}

export async function listPublishedBundles() {
  const db = await getDb();
  if (!db) return [];
  return attachBundleItems(await db.select().from(bundles).where(eq(bundles.status, "published")).orderBy(desc(bundles.createdAt)));
}

export async function listAdminBundles() {
  const db = await getDb();
  if (!db) return [];
  return attachBundleItems(await db.select().from(bundles).orderBy(desc(bundles.updatedAt)));
}

export async function getPublishedBundlesBySlugs(slugs: string[]) {
  const db = await getDb();
  if (!db || slugs.length === 0) return [];
  return attachBundleItems(await db.select().from(bundles).where(and(inArray(bundles.slug, slugs), eq(bundles.status, "published"))));
}

export async function getPublishedSellablesBySlugs(slugs: string[]) {
  const [products, publishedBundles] = await Promise.all([getPublishedProductsBySlugs(slugs), getPublishedBundlesBySlugs(slugs)]);
  return [...products, ...publishedBundles];
}

export async function getPublishedCatalogItem(slug: string) {
  const [products, publishedBundles] = await Promise.all([getPublishedProductsBySlugs([slug]), getPublishedBundlesBySlugs([slug])]);
  return [...products, ...publishedBundles][0];
}

export async function createBundle({ productIds, ...bundle }: BundleInput & { createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable while creating a bundle.");
  await db.transaction(async (tx) => {
    await tx.insert(bundles).values(bundle);
    await tx.insert(bundleItems).values(productIds.map((productId) => ({ bundleSlug: bundle.slug, productId })));
  });
  return (await listAdminBundles()).find((item) => item.slug === bundle.slug);
}

export async function updateBundle(slug: string, { productIds, ...bundle }: BundleInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable while updating a bundle.");
  await db.transaction(async (tx) => {
    await tx.update(bundles).set(bundle).where(eq(bundles.slug, slug));
    await tx.delete(bundleItems).where(eq(bundleItems.bundleSlug, slug));
    await tx.insert(bundleItems).values(productIds.map((productId) => ({ bundleSlug: slug, productId })));
  });
  return (await listAdminBundles()).find((item) => item.slug === slug);
}

export type CheckoutOfferInput = {
  status: "draft" | "published" | "archived";
  offerType: "upsell" | "downsell";
  sourceProductId: string;
  offerProductId: string;
  title: string;
  body: string;
  ctaLabel: string;
  offerTotalPriceSatang: number;
  priority: number;
};

export async function listAdminCheckoutOffers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checkoutOffers).orderBy(desc(checkoutOffers.updatedAt));
}

export async function listPublishedCheckoutOffers(sourceProductId: string, offerType: "upsell" | "downsell") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checkoutOffers).where(and(eq(checkoutOffers.sourceProductId, sourceProductId), eq(checkoutOffers.offerType, offerType), eq(checkoutOffers.status, "published"))).orderBy(desc(checkoutOffers.priority), desc(checkoutOffers.updatedAt));
}

export async function getPublishedCheckoutOffer(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(checkoutOffers).where(and(eq(checkoutOffers.id, id), eq(checkoutOffers.status, "published"))).limit(1);
  return result[0];
}

export async function createCheckoutOffer(offer: CheckoutOfferInput & { createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable while creating checkout offer.");
  const result = await db.insert(checkoutOffers).values(offer);
  const id = Number(result[0].insertId);
  return (await listAdminCheckoutOffers()).find((item) => item.id === id);
}

export async function updateCheckoutOffer(id: number, offer: CheckoutOfferInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable while updating checkout offer.");
  await db.update(checkoutOffers).set(offer).where(eq(checkoutOffers.id, id));
  return (await listAdminCheckoutOffers()).find((item) => item.id === id);
}

export async function listAdminProducts() {
  await ensureDefaultProducts();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(storeProducts).orderBy(desc(storeProducts.updatedAt));
}

export async function getProductBySlug(slug: string) {
  await ensureDefaultProducts();
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(storeProducts).where(eq(storeProducts.slug, slug)).limit(1);
  return result[0];
}

export async function getPublishedProductsBySlugs(slugs: string[]) {
  await ensureDefaultProducts();
  const db = await getDb();
  if (!db || slugs.length === 0) return [];
  return db.select().from(storeProducts).where(and(inArray(storeProducts.slug, slugs), eq(storeProducts.status, "published")));
}

export async function getProductsBySlugs(slugs: string[]) {
  const db = await getDb();
  if (!db || slugs.length === 0) return [];
  return db.select().from(storeProducts).where(inArray(storeProducts.slug, slugs));
}

export async function createStoreProduct(product: InsertStoreProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable while creating a product.");
  await db.insert(storeProducts).values(product);
  return getProductBySlug(product.slug);
}

export async function updateStoreProduct(slug: string, product: Partial<InsertStoreProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable while updating a product.");
  await db.update(storeProducts).set(product).where(eq(storeProducts.slug, slug));
  return getProductBySlug(slug);
}

export async function listAdminOrders() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: purchases.id,
      productId: purchases.productId,
      stripeCheckoutSessionId: purchases.stripeCheckoutSessionId,
      stripePaymentIntentId: purchases.stripePaymentIntentId,
      purchasedAt: purchases.purchasedAt,
      buyerName: users.name,
      buyerEmail: users.email,
    })
    .from(purchases)
    .innerJoin(users, eq(purchases.userId, users.id))
    .orderBy(desc(purchases.purchasedAt));
}

export async function listUserPurchases(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(purchases).where(eq(purchases.userId, userId)).orderBy(desc(purchases.purchasedAt));
}

export async function hasProductAccess(userId: number, productId: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select({ id: purchases.id })
    .from(purchases)
    .where(and(eq(purchases.userId, userId), eq(purchases.productId, productId)))
    .limit(1);
  return result.length > 0;
}

export async function grantPurchaseAccess({
  userId,
  productId,
  stripeCheckoutSessionId,
  stripePaymentIntentId,
}: {
  userId: number;
  productId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable while granting purchase access.");

  const existing = await db
    .select({ id: purchases.id })
    .from(purchases)
    .where(and(eq(purchases.userId, userId), eq(purchases.productId, productId)))
    .limit(1);

  if (existing.length > 0) return existing[0];

  await db.insert(purchases).values({
    userId,
    productId,
    stripeCheckoutSessionId,
    stripePaymentIntentId,
  });

  const product = await db.select({ title: storeProducts.title }).from(storeProducts).where(eq(storeProducts.slug, productId)).limit(1);
  const preferences = await getNotificationPreferences(userId);
  if (preferences.purchaseEnabled) await db.insert(notifications).values({
    userId,
    kind: "purchase",
    title: "เปิดหมากใหม่ในคลังของคุณแล้ว",
    body: product[0] ? `คุณเปิดสิทธิ์ “${product[0].title}” เรียบร้อยแล้ว` : "การสั่งซื้อของคุณได้รับการยืนยันแล้ว",
    href: `/read/${productId}`,
  });

  return { userId, productId, stripeCheckoutSessionId };
}

export async function listUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(30);
}

export async function markNotificationRead({ userId, id }: { userId: number; id: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable while updating notification.");
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, id), eq(notifications.userId, userId), isNull(notifications.readAt)));
  return { id };
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable while updating notifications.");
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return { success: true } as const;
}

const defaultNotificationPreferences = { productEnabled: true, purchaseEnabled: true, systemEnabled: true } as const;

export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return defaultNotificationPreferences;
  const result = await db.select({ productEnabled: notificationPreferences.productEnabled, purchaseEnabled: notificationPreferences.purchaseEnabled, systemEnabled: notificationPreferences.systemEnabled }).from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  return result[0] ?? defaultNotificationPreferences;
}

export async function updateNotificationPreferences({ userId, productEnabled, purchaseEnabled, systemEnabled }: { userId: number; productEnabled: boolean; purchaseEnabled: boolean; systemEnabled: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable while updating notification preferences.");
  await db.insert(notificationPreferences).values({ userId, productEnabled, purchaseEnabled, systemEnabled }).onDuplicateKeyUpdate({ set: { productEnabled, purchaseEnabled, systemEnabled } });
  return { productEnabled, purchaseEnabled, systemEnabled };
}

export async function createNotificationsForAllUsers({ kind, title, body, href }: { kind: "product" | "system"; title: string; body: string; href: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable while creating notifications.");
  const candidates = await db.select({ id: users.id, productEnabled: notificationPreferences.productEnabled, systemEnabled: notificationPreferences.systemEnabled }).from(users).leftJoin(notificationPreferences, eq(users.id, notificationPreferences.userId));
  const recipients = candidates.filter((recipient) => kind === "product" ? recipient.productEnabled !== false : recipient.systemEnabled !== false);
  if (recipients.length === 0) return { recipients: 0 };
  await db.insert(notifications).values(recipients.map((recipient) => ({ userId: recipient.id, kind, title, body, href })));
  return { recipients: recipients.length };
}

export async function createOrUpdateTestimonial({
  userId,
  productId,
  displayName,
  feedback,
}: {
  userId: number;
  productId: string;
  displayName: string;
  feedback: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable while saving learner feedback.");

  await db
    .insert(testimonials)
    .values({ userId, productId, displayName, feedback, consentToPublish: true, status: "pending", reviewedBy: null, reviewedAt: null })
    .onDuplicateKeyUpdate({
      set: { displayName, feedback, consentToPublish: true, status: "pending", reviewedBy: null, reviewedAt: null },
    });

  const result = await db
    .select()
    .from(testimonials)
    .where(and(eq(testimonials.userId, userId), eq(testimonials.productId, productId)))
    .limit(1);
  return result[0];
}

export async function listApprovedTestimonials() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: testimonials.id,
      productId: testimonials.productId,
      displayName: testimonials.displayName,
      feedback: testimonials.feedback,
      createdAt: testimonials.createdAt,
      productTitle: storeProducts.title,
    })
    .from(testimonials)
    .innerJoin(storeProducts, eq(testimonials.productId, storeProducts.slug))
    .where(and(eq(testimonials.status, "approved"), eq(testimonials.consentToPublish, true)))
    .orderBy(desc(testimonials.reviewedAt), desc(testimonials.createdAt));
}

export async function listUserTestimonials(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: testimonials.id,
      productId: testimonials.productId,
      displayName: testimonials.displayName,
      feedback: testimonials.feedback,
      status: testimonials.status,
      createdAt: testimonials.createdAt,
      updatedAt: testimonials.updatedAt,
      productTitle: storeProducts.title,
    })
    .from(testimonials)
    .leftJoin(storeProducts, eq(testimonials.productId, storeProducts.slug))
    .where(eq(testimonials.userId, userId))
    .orderBy(desc(testimonials.updatedAt));
}

export async function listAdminTestimonials() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: testimonials.id,
      productId: testimonials.productId,
      displayName: testimonials.displayName,
      feedback: testimonials.feedback,
      consentToPublish: testimonials.consentToPublish,
      status: testimonials.status,
      createdAt: testimonials.createdAt,
      reviewedAt: testimonials.reviewedAt,
      learnerName: users.name,
      learnerEmail: users.email,
      productTitle: storeProducts.title,
    })
    .from(testimonials)
    .innerJoin(users, eq(testimonials.userId, users.id))
    .leftJoin(storeProducts, eq(testimonials.productId, storeProducts.slug))
    .orderBy(desc(testimonials.updatedAt));
}

export async function getTestimonialById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(testimonials).where(eq(testimonials.id, id)).limit(1);
  return result[0];
}

export async function updateTestimonialStatus({ id, status, reviewedBy }: { id: number; status: "pending" | "approved" | "hidden" | "rejected"; reviewedBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable while moderating learner feedback.");
  await db.update(testimonials).set({ status, reviewedBy, reviewedAt: new Date() }).where(eq(testimonials.id, id));
  return { id, status };
}
