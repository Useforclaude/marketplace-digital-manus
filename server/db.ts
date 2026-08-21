import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertStoreProduct, InsertUser, purchases, storeProducts, users } from "../drizzle/schema";
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
  return db.select().from(purchases).where(eq(purchases.userId, userId));
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

  return { userId, productId, stripeCheckoutSessionId };
}
