import { findProduct } from "@shared/products";
import type { Request, Response } from "express";
import Stripe from "stripe";
import { grantPurchaseAccess } from "./db";

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured.");
  return new Stripe(key);
}

export function parseStripeEntitlement(session: Stripe.Checkout.Session) {
  const userId = Number(session.metadata?.user_id ?? session.client_reference_id);
  if (!Number.isInteger(userId) || userId < 1) throw new Error("Checkout session is missing a valid buyer ID.");

  let productIds: unknown;
  try {
    productIds = JSON.parse(session.metadata?.product_ids ?? "[]");
  } catch {
    throw new Error("Checkout session contains invalid product metadata.");
  }

  if (!Array.isArray(productIds) || productIds.length === 0 || productIds.some((id) => typeof id !== "string" || !findProduct(id))) {
    throw new Error("Checkout session contains unknown products.");
  }

  return {
    userId,
    productIds: Array.from(new Set(productIds as string[])),
    sessionId: session.id,
    paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
  };
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || Array.isArray(signature) || !secret) return res.status(400).json({ error: "Missing Stripe signature configuration." });

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(req.body, signature, secret);
  } catch (error) {
    console.error("[Stripe webhook] Signature verification failed", error);
    return res.status(400).json({ error: "Invalid webhook signature." });
  }

  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid") {
        const entitlement = parseStripeEntitlement(session);
        await Promise.all(
          entitlement.productIds.map((productId) =>
            grantPurchaseAccess({
              userId: entitlement.userId,
              productId,
              stripeCheckoutSessionId: entitlement.sessionId,
              stripePaymentIntentId: entitlement.paymentIntentId,
            }),
          ),
        );
      }
    }

    console.log("[Stripe webhook]", { eventType: event.type, eventId: event.id, created: event.created });
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Stripe webhook] Processing failed", { eventId: event.id, error });
    return res.status(500).json({ error: "Webhook processing failed." });
  }
}
