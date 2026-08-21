import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getPublishedProductsBySlugs: vi.fn() }));

import { getPublishedProductsBySlugs } from "./db";
import { validateCheckoutItems } from "./stripe";

const mockProducts = vi.mocked(getPublishedProductsBySlugs);
const trustedProduct = { slug: "atlas-of-attention", title: "แผนที่แห่งสมาธิ", subtitle: null, description: "รายละเอียด", currency: "thb", priceSatang: 79000 };

describe("checkout item validation", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("builds prices from the trusted database catalog rather than a client value", async () => {
    mockProducts.mockResolvedValue([trustedProduct] as never);
    const [lineItem] = await validateCheckoutItems([{ productId: "atlas-of-attention", quantity: 2 }]);
    expect(lineItem.price_data.unit_amount).toBe(79000);
    expect(lineItem.price_data.currency).toBe("thb");
    expect(lineItem.quantity).toBe(2);
  });

  it("rejects unavailable products and empty carts", async () => {
    mockProducts.mockResolvedValue([]);
    await expect(validateCheckoutItems([{ productId: "not-a-real-edition", quantity: 1 }])).rejects.toThrow("ไม่พร้อมจำหน่าย");
    await expect(validateCheckoutItems([])).rejects.toThrow("ตะกร้าสินค้าว่าง");
  });
});
