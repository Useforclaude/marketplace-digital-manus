import Stripe from "stripe";
import { getPublishedBundlesBySlugs, getPublishedProductsBySlugs } from "./db";
import type { CheckoutOffer } from "../drizzle/schema";

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

type CheckoutLine = {
  price_data: { currency: string; product_data: { name: string; description: string }; unit_amount: number };
  quantity: number;
  productId: string;
  entitlementProductIds: string[];
};

async function resolveCheckoutItems(items: CheckoutItemInput[]): Promise<CheckoutLine[]> {
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

  const lineItems = Array.from(normalized.entries()).map(([productId, quantity]) => {
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

  return lineItems;
}

export async function validateCheckoutItems(items: CheckoutItemInput[], offer?: CheckoutOffer): Promise<CheckoutLine[]> {
  const lineItems = await resolveCheckoutItems(items);
  if (!offer) return lineItems;
  const sourceLine = lineItems.find((lineItem) => lineItem.productId === offer.sourceProductId);
  if (!sourceLine || sourceLine.quantity !== 1) throw new Error("Offer ใช้ได้กับสินค้าต้นทางหนึ่งรายการต่อครั้งเท่านั้น");
  if (lineItems.some((lineItem) => lineItem.productId === offer.offerProductId)) throw new Error("ไม่สามารถใช้ Offer กับสินค้าที่อยู่ในตะกร้าแล้ว");

  const offeredLine = (await resolveCheckoutItems([{ productId: offer.offerProductId, quantity: 1 }]))[0];
  if (!offeredLine || offeredLine.price_data.currency !== sourceLine.price_data.currency) throw new Error("สกุลเงินของ Offer ไม่ตรงกับสินค้าต้นทาง");

  return [
    ...lineItems.filter((lineItem) => lineItem.productId !== offer.sourceProductId),
    {
      price_data: {
        currency: sourceLine.price_data.currency,
        product_data: { name: offer.title, description: offer.body },
        unit_amount: offer.offerTotalPriceSatang,
      },
      quantity: 1,
      productId: `offer-${offer.id}`,
      entitlementProductIds: Array.from(new Set([...sourceLine.entitlementProductIds, ...offeredLine.entitlementProductIds])),
    },
  ];
}

export async function createCheckoutSession({
  user,
  items,
  offer,
  origin,
}: {
  user: CheckoutUser;
  items: CheckoutItemInput[];
  offer?: CheckoutOffer;
  origin: string;
}) {
  const lineItems = await validateCheckoutItems(items, offer);
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
      ...(offer ? { checkout_offer_id: String(offer.id) } : {}),
    },
    line_items: lineItems.map(({ productId: _productId, entitlementProductIds: _entitlements, ...lineItem }) => lineItem),
    success_url: `${origin}/library?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?checkout=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return { url: session.url };
}
