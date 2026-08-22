import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Catalog records are kept in the database so an administrator can change
 * storefront metadata and price without deploying a new frontend bundle.
 * The paid content itself stays server-side in the `content` column.
 */
export const storeProducts = mysqlTable(
  "store_products",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 96 }).notNull(),
    productType: mysqlEnum("productType", ["ebook", "course"]).notNull(),
    status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
    title: varchar("title", { length: 220 }).notNull(),
    subtitle: varchar("subtitle", { length: 255 }),
    description: text("description").notNull(),
    category: varchar("category", { length: 120 }).notNull(),
    coverUrl: varchar("coverUrl", { length: 1024 }).notNull(),
    coverKey: varchar("coverKey", { length: 512 }),
    accent: mysqlEnum("accent", ["lime", "violet", "rose", "cyan"]).default("lime").notNull(),
    priceSatang: int("priceSatang").notNull(),
    currency: varchar("currency", { length: 3 }).default("thb").notNull(),
    unitCount: int("unitCount").default(1).notNull(),
    durationLabel: varchar("durationLabel", { length: 80 }).notNull(),
    content: text("content").notNull(),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("store_products_slug_unique").on(table.slug)],
);

export type StoreProductRecord = typeof storeProducts.$inferSelect;
export type InsertStoreProduct = typeof storeProducts.$inferInsert;

/**
 * Local business entitlement records. Stripe remains the source of truth for
 * payment details; this table only tracks which account can open which edition.
 */
export const purchases = mysqlTable(
  "purchases",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: varchar("productId", { length: 96 }).notNull(),
    stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }).notNull(),
    stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
    purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("purchases_user_product_unique").on(table.userId, table.productId),
    uniqueIndex("purchases_session_product_unique").on(table.stripeCheckoutSessionId, table.productId),
  ],
);

export type Purchase = typeof purchases.$inferSelect;

/**
 * A notification belongs to exactly one user. Product publication, purchase
 * fulfillment and an admin-issued system update create real rows here; the
 * browser never decides recipients or unread state.
 */
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: mysqlEnum("kind", ["product", "purchase", "system"]).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    body: varchar("body", { length: 600 }).notNull(),
    href: varchar("href", { length: 512 }).notNull(),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("notifications_user_read_created_index").on(table.userId, table.readAt, table.createdAt)],
);

export type Notification = typeof notifications.$inferSelect;

/**
 * Learner feedback is collected only from members who own the referenced
 * product. It remains private until a moderator explicitly approves it after
 * the member has provided publication consent.
 */
export const testimonials = mysqlTable(
  "testimonials",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: varchar("productId", { length: 96 }).notNull(),
    displayName: varchar("displayName", { length: 80 }).notNull(),
    feedback: text("feedback").notNull(),
    consentToPublish: boolean("consentToPublish").default(false).notNull(),
    status: mysqlEnum("status", ["pending", "approved", "hidden", "rejected"]).default("pending").notNull(),
    reviewedBy: int("reviewedBy").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("testimonials_user_product_unique").on(table.userId, table.productId),
    index("testimonials_public_feed_index").on(table.status, table.consentToPublish, table.createdAt),
  ],
);

export type Testimonial = typeof testimonials.$inferSelect;
