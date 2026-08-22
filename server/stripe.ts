import Stripe from "stripe";
import { getPublishedBundlesBySlugs, getPublishedProductsBySlugs } from "./db";

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

export async function validateCheckoutItems(items: CheckoutItemInput[]) {
  const normalized = new Map<string, number>();

  for (const item of items) {
    const quantity = Math.max(1, Math.min(5, Math.floor(item.quantity)));
    normalized.set(item.productId, Math.min(5, (normalized.get(item.productId) ?? 0) + quantity));
  }

  if (normalized.size === 0) throw new Error("ตะกร้าสินค้าว่างอยู่");

  const requestedIds = Array.from(normalized.keys());
  const [products, bundles] = await Promise.all([getPublishedProductsBySlugs(requestedIds), getPublishedBundlesBySlugs(requestedIds)]);
  if (products.length + bundles.length !== normalized.size) throw new Error("มีสินค้าที่ไม่พร้อมจำหน่ายอยู่ในตะกร้า");
  const productBySlug = new Map(products.map((product) => [product.slug, product]));
  const bundleBySlug = new Map(bundles.map((bundle) => [bundle.slug, bundle]));

  return Array.from(normalized.entries()).map(([productId, quantity]) => {
    const product = productBySlug.get(productId);
    const bundle = bundleBySlug.get(productId);
    const sellable = product ?? bundle;
    if (!sellable) throw new Error("มีสินค้าที่ไม่พร้อมจำหน่ายอยู่ในตะกร้า");
    const entitlementProductIds = product ? [product.slug] : bundle!.includedProductIds;
    if (entitlementProductIds.length === 0) throw new Error("Bundle นี้ยังไม่มีสินค้าอยู่ภายใน");
    return {
      price_data: {
        currency: sellable.currency,
        product_data: {
          name: sellable.title,
          description: sellable.subtitle ?? sellable.description,
        },
        unit_amount: sellable.priceSatang,
      },
      quantity,
      productId,
      entitlementProductIds: entitlementProductIds.flatMap((id) => Array.from({ length: quantity }, () => id)),
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
  const lineItems = await validateCheckoutItems(items);
  const productIds = Array.from(new Set(lineItems.flatMap((item) => item.entitlementProductIds)));
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
    line_items: lineItems.map(({ productId: _productId, entitlementProductIds: _entitlements, ...lineItem }) => lineItem),
    success_url: `${origin}/library?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?checkout=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return { url: session.url };
}
