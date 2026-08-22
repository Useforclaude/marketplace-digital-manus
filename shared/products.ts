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

export function formatCurrencyFromSatang(value: number, currency = "thb") {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(value / 100);
}
