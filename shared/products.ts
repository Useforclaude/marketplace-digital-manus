export type StoreProduct = {
  id: string;
  format: string;
  category: string;
  title: string;
  description: string;
  priceCents: number;
  currency: "usd";
  coverUrl: string;
  accent: "chartreuse" | "cobalt" | "coral";
  chapters: number;
  readingTime: string;
};

/**
 * Single commercial source of truth. Stripe line items are always generated
 * server-side from this list; the browser cannot set product prices.
 */
export const products: StoreProduct[] = [
  {
    id: "atlas-of-attention",
    format: "eBook · HTML",
    category: "FOCUS & SYSTEMS",
    title: "Atlas of Attention",
    description: "A field guide for designing a calmer, more intentional relationship with your time.",
    priceCents: 2400,
    currency: "usd",
    coverUrl: "/manus-storage/atlas-of-attention-cover_def02da8.png",
    accent: "chartreuse",
    chapters: 8,
    readingTime: "72 min read",
  },
  {
    id: "interface-intelligence",
    format: "eBook · HTML",
    category: "DESIGN PRACTICE",
    title: "Interface Intelligence",
    description: "A practical lens for making digital experiences feel clear, considered, and deeply human.",
    priceCents: 3200,
    currency: "usd",
    coverUrl: "/manus-storage/interface-intelligence-cover-v2_837bf46f.png",
    accent: "cobalt",
    chapters: 10,
    readingTime: "96 min read",
  },
  {
    id: "creative-compass",
    format: "eBook · HTML",
    category: "CREATIVE DIRECTION",
    title: "Creative Compass",
    description: "A concise companion for turning ambiguous creative work into a confident next move.",
    priceCents: 1800,
    currency: "usd",
    coverUrl: "/manus-storage/creative-compass-cover-v2_930d2424.png",
    accent: "coral",
    chapters: 6,
    readingTime: "54 min read",
  },
];

export const productById = Object.fromEntries(products.map((product) => [product.id, product]));

export function findProduct(productId: string) {
  return products.find((product) => product.id === productId);
}

export function formatCurrencyFromCents(value: number, currency: StoreProduct["currency"] = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(value / 100);
}
