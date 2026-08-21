import { describe, expect, it } from "vitest";
import { validateCheckoutItems } from "./stripe";

describe("checkout item validation", () => {
  it("builds prices from the trusted server catalog rather than a client value", () => {
    const [lineItem] = validateCheckoutItems([{ productId: "atlas-of-attention", quantity: 2 }]);
    expect(lineItem.price_data.unit_amount).toBe(2400);
    expect(lineItem.quantity).toBe(2);
  });

  it("rejects unknown products and empty carts", () => {
    expect(() => validateCheckoutItems([{ productId: "not-a-real-edition", quantity: 1 }])).toThrow("Unknown product");
    expect(() => validateCheckoutItems([])).toThrow("cart is empty");
  });
});
