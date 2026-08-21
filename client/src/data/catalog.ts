import { formatCurrencyFromSatang } from "@shared/products";

export type { StoreProduct as Product } from "@shared/products";

export const formatCurrency = (valueSatang: number) => formatCurrencyFromSatang(valueSatang);

export function formatProductType(productType: "ebook" | "course") {
  return productType === "ebook" ? "eBook · HTML" : "คอร์สออนไลน์";
}
