import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  hasProductAccess: vi.fn(),
  listUserPurchases: vi.fn(),
  getProductBySlug: vi.fn(),
}));

import { getProductBySlug, hasProductAccess, listUserPurchases } from "./db";
import { appRouter } from "./routers";

const mockedHasProductAccess = vi.mocked(hasProductAccess);
const mockedListUserPurchases = vi.mocked(listUserPurchases);
const mockedGetProductBySlug = vi.mocked(getProductBySlug);
const product = {
  id: 1, slug: "atlas-of-attention", productType: "ebook", status: "published", title: "แผนที่แห่งสมาธิ", subtitle: null,
  description: "รายละเอียดทดสอบ", category: "โฟกัส", coverUrl: "/cover.png", coverKey: null, accent: "lime", priceSatang: 79000,
  currency: "thb", unitCount: 3, durationLabel: "72 นาที", content: JSON.stringify({ kind: "ebook", intro: "เกริ่นนำ", chapters: [{ kicker: "บทที่ 01", title: "เริ่มต้น", body: ["เนื้อหา"] }] }), createdBy: 1, createdAt: new Date(), updatedAt: new Date(),
};

function createCaller() {
  return appRouter.createCaller({
    user: {
      id: 12,
      openId: "reader-test-user",
      name: "Reader Test",
      email: "reader@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as never,
    res: {} as never,
  });
}

describe("protected eBook reader", () => {
  beforeEach(() => { vi.clearAllMocks(); mockedGetProductBySlug.mockResolvedValue(product as never); });

  it("denies an authenticated member who has not purchased the requested edition", async () => {
    mockedHasProductAccess.mockResolvedValue(false);
    await expect(createCaller().library.reader({ productId: "atlas-of-attention" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns the authenticated member's library entitlement list", async () => {
    mockedListUserPurchases.mockResolvedValue([
      {
        id: 1,
        userId: 12,
        productId: "atlas-of-attention",
        stripeCheckoutSessionId: "cs_123",
        stripePaymentIntentId: "pi_123",
        purchasedAt: new Date("2026-08-21T00:00:00.000Z"),
      },
    ]);

    const response = await createCaller().library.list();
    expect(response).toHaveLength(1);
    expect(response[0]?.product.slug).toBe("atlas-of-attention");
  });

  it("returns chapter content only for a member with a matching purchase entitlement", async () => {
    mockedHasProductAccess.mockResolvedValue(true);
    const response = await createCaller().library.reader({ productId: "atlas-of-attention" });
    expect(response.product.slug).toBe("atlas-of-attention");
    expect(response.content).toMatchObject({ kind: "ebook" });
  });
});
