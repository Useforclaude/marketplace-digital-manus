import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");

const stripe = new Stripe(secretKey);
const account = await stripe.accounts.retrieve();
console.log(JSON.stringify({
  accountId: account.id,
  displayName: account.settings?.dashboard?.display_name ?? null,
  email: account.email ?? null,
  livemode: account.livemode,
  chargesEnabled: account.charges_enabled,
  payoutsEnabled: account.payouts_enabled,
  detailsSubmitted: account.details_submitted,
  type: account.type,
}));
