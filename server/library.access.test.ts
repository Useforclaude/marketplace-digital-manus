import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  hasProductAccess: vi.fn(),
  listUserPurchases: vi.fn(),
}));

import { hasProductAccess, listUserPurchases } from "./db";
import { appRouter } from "./routers";

const mockedHasProductAccess = vi.mocked(hasProductAccess);
const mockedListUserPurchases = vi.mocked(listUserPurchases);

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
  beforeEach(() => vi.clearAllMocks());

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
    expect(response[0]?.product.id).toBe("atlas-of-attention");
  });

  it("returns chapter content only for a member with a matching purchase entitlement", async () => {
    mockedHasProductAccess.mockResolvedValue(true);
    const response = await createCaller().library.reader({ productId: "atlas-of-attention" });
    expect(response.product.id).toBe("atlas-of-attention");
    expect(response.edition.chapters).toHaveLength(3);
  });
});
