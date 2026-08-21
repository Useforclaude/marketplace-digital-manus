import { describe, expect, it } from "vitest";
import { findProduct, formatCurrencyFromCents, products } from "./products";

describe("product catalog", () => {
  it("has a unique valid identifier and positive server-side price for every edition", () => {
    const ids = products.map((product) => product.id);
    expect(new Set(ids).size).toBe(products.length);
    expect(products.every((product) => product.priceCents >= 50 && product.currency === "usd")).toBe(true);
  });

  it("finds products by their public catalog id and formats a price from cents", () => {
    expect(findProduct("atlas-of-attention")?.title).toBe("Atlas of Attention");
    expect(formatCurrencyFromCents(2400)).toBe("$24");
  });
});
