import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { parseStripeEntitlement } from "./stripeWebhook";

describe("Stripe checkout entitlement parsing", () => {
  it("accepts only a valid buyer id and trusted product ids", () => {
    const entitlement = parseStripeEntitlement({
      id: "cs_123",
      client_reference_id: "7",
      payment_intent: "pi_123",
      metadata: { user_id: "7", product_ids: JSON.stringify(["atlas-of-attention", "atlas-of-attention"]) },
    } as unknown as Stripe.Checkout.Session);

    expect(entitlement).toEqual({
      userId: 7,
      productIds: ["atlas-of-attention"],
      sessionId: "cs_123",
      paymentIntentId: "pi_123",
    });
  });

  it("rejects a session that attempts to unlock an unknown edition", () => {
    expect(() =>
      parseStripeEntitlement({
        id: "cs_123",
        client_reference_id: "7",
        metadata: { user_id: "7", product_ids: JSON.stringify(["not-a-real-edition"]) },
      } as unknown as Stripe.Checkout.Session),
    ).toThrow("unknown products");
  });
});
