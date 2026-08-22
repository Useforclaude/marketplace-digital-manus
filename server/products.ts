import type { StoreProductRecord } from "../drizzle/schema";
import type { PublicPreview, StoreProduct } from "@shared/products";

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

function toPreviewText(value: unknown, limit = 420) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function parseConfiguredPreview(previewContent: string | null) {
  if (!previewContent) return null;
  try {
    const parsed = JSON.parse(previewContent) as { intro?: unknown; sections?: unknown };
    const intro = toPreviewText(parsed.intro, 650);
    const sections = Array.isArray(parsed.sections)
      ? parsed.sections.slice(0, 2).flatMap((section) => {
          if (!section || typeof section !== "object") return [];
          const candidate = section as { kicker?: unknown; title?: unknown; body?: unknown };
          const title = toPreviewText(candidate.title, 180);
          const body = Array.isArray(candidate.body) ? candidate.body.map((entry) => toPreviewText(entry, 650)).filter(Boolean).slice(0, 2) : [];
          return title ? [{ kicker: toPreviewText(candidate.kicker, 80), title, body }] : [];
        })
      : [];
    return intro || sections.length ? { intro, sections } satisfies PublicPreview : null;
  } catch {
    return null;
  }
}

/** Produces a maximum two-section teaser and never returns the paid JSON itself. */
export function toPublicPreview(product: Pick<StoreProductRecord, "previewContent"> & { content?: string | null }): PublicPreview | null {
  const configured = parseConfiguredPreview(product.previewContent);
  if (configured) return configured;
  if (!product.content) return null;

  try {
    const content = parsePaidContent(product.content) as { intro?: unknown; chapters?: unknown; modules?: unknown };
    const candidates = Array.isArray(content.chapters) ? content.chapters : Array.isArray(content.modules) ? content.modules : [];
    const sections = candidates.slice(0, 2).flatMap((section, index) => {
      if (!section || typeof section !== "object") return [];
      const candidate = section as { kicker?: unknown; title?: unknown; summary?: unknown; body?: unknown; duration?: unknown };
      const title = toPreviewText(candidate.title, 180);
      const body = Array.isArray(candidate.body)
        ? candidate.body.map((entry) => toPreviewText(entry, 650)).filter(Boolean).slice(0, 2)
        : [toPreviewText(candidate.summary, 650)].filter(Boolean);
      return title ? [{ kicker: toPreviewText(candidate.kicker ?? candidate.duration ?? `ตัวอย่าง ${index + 1}`, 80), title, body }] : [];
    });
    const intro = toPreviewText(content.intro, 650);
    return intro || sections.length ? { intro, sections } : null;
  } catch {
    return null;
  }
}
