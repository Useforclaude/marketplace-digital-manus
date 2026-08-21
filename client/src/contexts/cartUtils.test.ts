import { describe, expect, it } from "vitest";
import type { Product } from "@/data/catalog";
import { addCartLine, getCartSummary, setCartLineQuantity } from "./cartUtils";

const products: Product[] = [
  { slug: "atlas-of-attention", productType: "ebook", category: "โฟกัส", title: "แผนที่", subtitle: null, description: "รายละเอียดทดสอบ", priceSatang: 79000, currency: "thb", coverUrl: "/cover-a.png", accent: "lime", unitCount: 8, durationLabel: "72 นาที" },
  { slug: "interface-intelligence", productType: "ebook", category: "ดีไซน์", title: "อินเทอร์เฟซ", subtitle: null, description: "รายละเอียดทดสอบ", priceSatang: 99000, currency: "thb", coverUrl: "/cover-b.png", accent: "cyan", unitCount: 10, durationLabel: "96 นาที" },
];

describe("cart utilities", () => {
  it("merges duplicate additions, caps item quantity, and calculates the trusted catalog total", () => {
    let cart = addCartLine([], "atlas-of-attention");
    cart = addCartLine(cart, "atlas-of-attention");
    cart = setCartLineQuantity(cart, "interface-intelligence", 2);
    cart = [...cart, { productId: "interface-intelligence", quantity: 2 }];

    const summary = getCartSummary(cart, products);
    expect(summary.itemCount).toBe(4);
    expect(summary.subtotal).toBe(356000);
  });

  it("removes a line when a quantity reaches zero and ignores an unknown id in the summary", () => {
    const cart = setCartLineQuantity([{ productId: "atlas-of-attention", quantity: 1 }], "atlas-of-attention", 0);
    const summary = getCartSummary([...cart, { productId: "unknown", quantity: 4 }], products);
    expect(summary.items).toHaveLength(0);
    expect(summary.subtotal).toBe(0);
  });
});
