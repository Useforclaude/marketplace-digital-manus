import { formatCurrencyFromCents, productById, products, type StoreProduct } from "@shared/products";

export { productById, products, type StoreProduct as Product };

export const formatCurrency = (valueCents: number) => formatCurrencyFromCents(valueCents);
