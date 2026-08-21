import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

vi.mock("./db", () => ({ getProductsBySlugs: vi.fn(), grantPurchaseAccess: vi.fn() }));

import { getProductsBySlugs } from "./db";
import { parseStripeEntitlement } from "./stripeWebhook";

const mockProducts = vi.mocked(getProductsBySlugs);

describe("Stripe checkout entitlement parsing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts only a valid buyer id and product ids confirmed by the database", async () => {
    mockProducts.mockResolvedValue([{ slug: "atlas-of-attention" }] as never);
    const entitlement = await parseStripeEntitlement({
      id: "cs_123",
      client_reference_id: "7",
      payment_intent: "pi_123",
      metadata: { user_id: "7", product_ids: JSON.stringify(["atlas-of-attention", "atlas-of-attention"]) },
    } as unknown as Stripe.Checkout.Session);

    expect(entitlement).toEqual({ userId: 7, productIds: ["atlas-of-attention"], sessionId: "cs_123", paymentIntentId: "pi_123" });
  });

  it("rejects a session that attempts to unlock an unknown product", async () => {
    mockProducts.mockResolvedValue([]);
    await expect(parseStripeEntitlement({
      id: "cs_123",
      client_reference_id: "7",
      metadata: { user_id: "7", product_ids: JSON.stringify(["not-a-real-edition"]) },
    } as unknown as Stripe.Checkout.Session)).rejects.toThrow("unknown products");
  });
});
