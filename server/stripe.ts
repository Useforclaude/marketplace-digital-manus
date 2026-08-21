import { findProduct } from "@shared/products";
import Stripe from "stripe";

export type CheckoutItemInput = {
  productId: string;
  quantity: number;
};

type CheckoutUser = {
  id: number;
  email?: string | null;
  name?: string | null;
};

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured. Add payment credentials in Settings → Payment.");
  return new Stripe(key);
}

export function validateCheckoutItems(items: CheckoutItemInput[]) {
  const normalized = new Map<string, number>();

  for (const item of items) {
    const product = findProduct(item.productId);
    if (!product) throw new Error(`Unknown product: ${item.productId}`);
    const quantity = Math.max(1, Math.min(5, Math.floor(item.quantity)));
    normalized.set(product.id, Math.min(5, (normalized.get(product.id) ?? 0) + quantity));
  }

  if (normalized.size === 0) throw new Error("Your cart is empty.");

  return Array.from(normalized.entries()).map(([productId, quantity]) => {
    const product = findProduct(productId)!;
    return {
      price_data: {
        currency: product.currency,
        product_data: {
          name: product.title,
          description: product.description,
        },
        unit_amount: product.priceCents,
      },
      quantity,
      productId,
    };
  });
}

export async function createCheckoutSession({
  user,
  items,
  origin,
}: {
  user: CheckoutUser;
  items: CheckoutItemInput[];
  origin: string;
}) {
  const lineItems = validateCheckoutItems(items);
  const productIds = lineItems.map((item) => item.productId);
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    allow_promotion_codes: true,
    client_reference_id: String(user.id),
    ...(user.email ? { customer_email: user.email } : {}),
    metadata: {
      user_id: String(user.id),
      customer_email: user.email ?? "",
      customer_name: user.name ?? "",
      product_ids: JSON.stringify(productIds),
    },
    line_items: lineItems.map(({ productId: _productId, ...lineItem }) => lineItem),
    success_url: `${origin}/library?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?checkout=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return { url: session.url };
}
