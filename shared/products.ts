export type StoreProduct = {
  slug: string;
  productType: "ebook" | "course";
  category: string;
  title: string;
  subtitle: string | null;
  description: string;
  priceSatang: number;
  currency: string;
  coverUrl: string;
  accent: "lime" | "violet" | "rose" | "cyan";
  unitCount: number;
  durationLabel: string;
};

export type StoreBundle = Omit<StoreProduct, "productType" | "durationLabel" | "accent"> & {
  productType: "bundle";
  durationLabel: string;
  accent: "lime";
  includedProductIds: string[];
};

export type SellableProduct = StoreProduct | StoreBundle;

export type PublicPreview = {
  intro: string;
  sections: Array<{ kicker: string; title: string; body: string[] }>;
};

export type PublicCatalogDetail = {
  product: SellableProduct;
  preview: PublicPreview | null;
  includedProducts: StoreProduct[];
};

export type PublicCheckoutOffer = {
  id: number;
  offerType: "upsell" | "downsell";
  sourceProductId: string;
  offerProduct: SellableProduct;
  title: string;
  body: string;
  ctaLabel: string;
  offerTotalPriceSatang: number;
};

export function formatCurrencyFromSatang(value: number, currency = "thb") {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(value / 100);
}
