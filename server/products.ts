import type { StoreProductRecord } from "../drizzle/schema";
import type { StoreProduct } from "@shared/products";

/** Removes protected manuscript/course data before a product crosses to the browser. */
export function toPublicProduct(product: StoreProductRecord): StoreProduct {
  return {
    slug: product.slug,
    productType: product.productType,
    category: product.category,
    title: product.title,
    subtitle: product.subtitle,
    description: product.description,
    priceSatang: product.priceSatang,
    currency: product.currency,
    coverUrl: product.coverUrl,
    accent: product.accent,
    unitCount: product.unitCount,
    durationLabel: product.durationLabel,
  };
}

export function parsePaidContent(content: string) {
  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new Error("Stored product content is invalid JSON.");
  }
}
