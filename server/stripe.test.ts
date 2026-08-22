import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getPublishedProductsBySlugs: vi.fn(), getPublishedBundlesBySlugs: vi.fn() }));

import { getPublishedBundlesBySlugs, getPublishedProductsBySlugs } from "./db";
import { validateCheckoutItems } from "./stripe";

const mockProducts = vi.mocked(getPublishedProductsBySlugs);
const mockBundles = vi.mocked(getPublishedBundlesBySlugs);
const trustedProduct = { slug: "atlas-of-attention", title: "แผนที่แห่งสมาธิ", subtitle: null, description: "รายละเอียด", currency: "thb", priceSatang: 79000 };
const trustedBundle = { slug: "focus-foundation", title: "ชุดตั้งหลักโฟกัส", subtitle: null, description: "รายละเอียด", currency: "thb", priceSatang: 129000, includedProductIds: ["atlas-of-attention", "decision-playbook"] };

describe("checkout item validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBundles.mockResolvedValue([] as never);
  });

  it("builds prices from the trusted database catalog rather than a client value", async () => {
    mockProducts.mockResolvedValue([trustedProduct] as never);
    const [lineItem] = await validateCheckoutItems([{ productId: "atlas-of-attention", quantity: 2 }]);
    expect(lineItem.price_data.unit_amount).toBe(79000);
    expect(lineItem.price_data.currency).toBe("thb");
    expect(lineItem.quantity).toBe(2);
  });

  it("prices a Bundle once while expanding its product entitlements server-side", async () => {
    mockProducts.mockResolvedValue([] as never);
    mockBundles.mockResolvedValue([trustedBundle] as never);
    const [lineItem] = await validateCheckoutItems([{ productId: "focus-foundation", quantity: 1 }]);
    expect(lineItem.price_data.unit_amount).toBe(129000);
    expect(lineItem.entitlementProductIds).toEqual(["atlas-of-attention", "decision-playbook"]);
  });

  it("replaces a source item with one trusted offer price and aggregates both entitlements", async () => {
    const offeredProduct = { slug: "creative-compass", title: "เข็มทิศความคิดสร้างสรรค์", subtitle: null, description: "รายละเอียด", currency: "thb", priceSatang: 59000 };
    mockProducts.mockResolvedValueOnce([trustedProduct] as never).mockResolvedValueOnce([offeredProduct] as never);
    const [lineItem] = await validateCheckoutItems([{ productId: "atlas-of-attention", quantity: 1 }], {
      id: 42,
      sourceProductId: "atlas-of-attention",
      offerProductId: "creative-compass",
      title: "แพ็กโฟกัสและความคิดสร้างสรรค์",
      body: "ราคาพิเศษจาก server",
      offerTotalPriceSatang: 119000,
    } as never);
    expect(lineItem.productId).toBe("offer-42");
    expect(lineItem.price_data.unit_amount).toBe(119000);
    expect(lineItem.entitlementProductIds).toEqual(["atlas-of-attention", "creative-compass"]);
  });

  it("rejects unavailable products and empty carts", async () => {
    mockProducts.mockResolvedValue([]);
    await expect(validateCheckoutItems([{ productId: "not-a-real-edition", quantity: 1 }])).rejects.toThrow("ไม่พร้อมจำหน่าย");
    await expect(validateCheckoutItems([])).rejects.toThrow("ตะกร้าสินค้าว่าง");
  });
});
