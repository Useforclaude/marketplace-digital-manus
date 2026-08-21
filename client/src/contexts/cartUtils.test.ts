import { describe, expect, it } from "vitest";
import { products } from "@/data/catalog";
import { addCartLine, getCartSummary, setCartLineQuantity } from "./cartUtils";

describe("cart utilities", () => {
  it("merges duplicate additions, caps item quantity, and calculates the trusted catalog total", () => {
    let cart = addCartLine([], "atlas-of-attention");
    cart = addCartLine(cart, "atlas-of-attention");
    cart = setCartLineQuantity(cart, "interface-intelligence", 2);
    cart = [...cart, { productId: "interface-intelligence", quantity: 2 }];

    const summary = getCartSummary(cart, products);
    expect(summary.itemCount).toBe(4);
    expect(summary.subtotal).toBe(11200);
  });

  it("removes a line when a quantity reaches zero and ignores an unknown id in the summary", () => {
    const cart = setCartLineQuantity([{ productId: "atlas-of-attention", quantity: 1 }], "atlas-of-attention", 0);
    const summary = getCartSummary([...cart, { productId: "unknown", quantity: 4 }], products);
    expect(summary.items).toHaveLength(0);
    expect(summary.subtotal).toBe(0);
  });
});
