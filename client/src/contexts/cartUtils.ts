import type { Product } from "@/data/catalog";

export type CartLine = {
  productId: string;
  quantity: number;
};

export type CartItem = CartLine & { product: Product };

export function addCartLine(lines: CartLine[], productId: string): CartLine[] {
  const existing = lines.find((line) => line.productId === productId);
  if (!existing) return [...lines, { productId, quantity: 1 }];
  return lines.map((line) => (line.productId === productId ? { ...line, quantity: Math.min(5, line.quantity + 1) } : line));
}

export function setCartLineQuantity(lines: CartLine[], productId: string, quantity: number): CartLine[] {
  if (quantity <= 0) return lines.filter((line) => line.productId !== productId);
  return lines.map((line) => (line.productId === productId ? { ...line, quantity: Math.min(5, quantity) } : line));
}

export function getCartSummary(lines: CartLine[], products: Product[]) {
  const items = lines
    .map((line) => {
      const product = products.find((item) => item.id === line.productId);
      return product ? { ...line, product } : null;
    })
    .filter((item): item is CartItem => Boolean(item));

  return {
    items,
    itemCount: items.reduce((total, line) => total + line.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.product.priceCents * item.quantity, 0),
  };
}
