import { formatCurrencyFromSatang } from "@shared/products";

export type { SellableProduct as Product } from "@shared/products";

export const formatCurrency = (valueSatang: number) => formatCurrencyFromSatang(valueSatang);

export function formatProductType(productType: "ebook" | "course" | "bundle") {
  return productType === "ebook" ? "eBook · HTML" : productType === "course" ? "คอร์สออนไลน์" : "Bundle · ชุดความรู้";
}
