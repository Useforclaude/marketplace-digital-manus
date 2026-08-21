# Brightline Marketplace — Engineering Handoff

**Brightline** is a dark editorial marketplace for selling individual digital editions. It combines a public storefront, member identity, persistent cart, Stripe Checkout, buyer-specific purchase entitlements, and an HTML eBook reader. This document is the operational source of truth for the next developer taking over the repository.

> The storefront is deliberately a **full-stack application**, not a static landing page. Authentication, payment verification, entitlement checks, and reader content must remain server-controlled to restrict a paid edition to its buyer at runtime.

## 1. Product Scope and Current State

Visitors can browse a small catalog, add editions to a local cart, and sign in before checkout. A Stripe Checkout Session is created only on the server from trusted product definitions. When Stripe confirms payment through the webhook, the application grants the buyer access to the specific edition. The buyer can then open that edition from `/library` and read it at `/read/:productId`.

| Capability | Current implementation | Primary location |
| --- | --- | --- |
| Public storefront | Dark editorial landing page with three curated product cards and generated cover art | `client/src/pages/Home.tsx` |
| Cart | Client-side localStorage cart with quantity controls, price summary, and checkout CTA | `client/src/contexts/CartContext.tsx` |
| Membership | Manus OAuth session, shared `useAuth()` hook, protected procedures | `server/_core/`, `client/src/_core/hooks/useAuth.ts` |
| Catalog and prices | Server-trusted product source shared with the UI | `shared/products.ts` |
| Checkout | Stripe-hosted Checkout Session created by tRPC mutation | `server/stripe.ts`, `server/routers.ts` |
| Payment fulfillment | Verified Stripe webhook grants access records | `server/stripeWebhook.ts`, `server/db.ts` |
| Library | Buyer-specific owned-edition grid | `client/src/pages/Library.tsx` |
| HTML reader | Protected reader that fetches chapter content only after entitlement validation | `client/src/pages/Reader.tsx`, `server/ebookContent.ts` |
| Automated verification | Vitest coverage for catalog, checkout price guard, webhook metadata, and reader access | `shared/*.test.ts`, `server/*.test.ts` |

## 2. Technology Stack

The current application uses the template’s full-stack TypeScript architecture. The frontend and server deliberately share types and product definitions so that an edition’s identity and price cannot drift between the card shown to a buyer and the Stripe line item created for payment.

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Frontend | React 19, TypeScript, Vite, Wouter | Storefront, cart, library, protected reader routes |
| Styling | Tailwind CSS 4, custom CSS variables, Manrope, Playfair Display, DM Mono | Dark editorial design system and responsive layouts |
| UI primitives | shadcn/ui foundation, Lucide icons, Sonner | Accessible shared primitives, icons, and feedback toasts |
| API | Express 4, tRPC 11, Zod | Typed server procedures and input validation under `/api/trpc` |
| Authentication | Manus OAuth and signed session cookie | Member sign-in, protected procedures, user identity |
| Database | MySQL/TiDB, Drizzle ORM | User table plus business-specific purchase entitlement records |
| Payments | Stripe Checkout and signed webhooks | Hosted payment, payment confirmation, entitlement grant |
| Tests | Vitest | Unit tests for core commerce and access controls |

## 3. System Architecture

```mermaid
flowchart LR
  V[Visitor] --> S[React storefront]
  S --> C[Local cart]
  S --> A[Manus OAuth]
  A --> T[tRPC API]
  C --> T
  T --> P[shared/products.ts]
  T --> SC[Stripe Checkout Session]
  SC --> ST[Stripe hosted checkout]
  ST --> WH[/api/stripe/webhook]
  WH --> DB[(MySQL/TiDB purchases)]
  DB --> T
  T --> L[Protected library and HTML reader]
  L --> V
```

The browser never supplies a monetary amount to Stripe. It sends only product IDs and quantities. `server/stripe.ts` resolves these IDs against `shared/products.ts` and builds the Stripe line items from the trusted `priceCents` values. This prevents a modified browser request from changing an edition price.

Stripe delivers payment events to a public HTTPS endpoint. The application registers `/api/stripe/webhook` **before** the JSON parser so the raw request body is available for signature verification. Stripe recommends webhook-driven fulfillment because a browser redirect alone is not a trustworthy indicator that payment completed.[1] [2]

## 4. Repository Map

| Path | What belongs here | Maintenance notes |
| --- | --- | --- |
| `client/src/pages/` | Route-level screens | Keep each major visitor journey in its own page component. |
| `client/src/components/` | Reusable visual components | `StoreHeader.tsx` is the shared storefront navigation. |
| `client/src/contexts/CartContext.tsx` | Browser cart state | The cart is intentionally local until checkout begins. Never treat it as a payment record. |
| `client/src/data/catalog.ts` | Client-facing catalog re-export | Do not put prices here; it re-exports the shared source. |
| `shared/products.ts` | Product IDs, copy, price, cover assets | This is the sole source of truth for purchasable editions. |
| `server/routers.ts` | Typed API procedures | Use `protectedProcedure` for all member, checkout, and reader actions. |
| `server/stripe.ts` | Checkout Session creation and trusted line-item construction | Never accept client-provided prices, currency, or product descriptions. |
| `server/stripeWebhook.ts` | Signature verification and access fulfillment | Preserve raw-body handling in `server/_core/index.ts`. |
| `server/ebookContent.ts` | Server-only HTML-reader manuscript data | Replace sample chapters with production copy; do not import this module in client code. |
| `drizzle/schema.ts` | Drizzle schema | Modify first, generate migration, review SQL, then apply migration. |
| `server/db.ts` | Database helpers | Keep Stripe financial data out of local storage except identifiers needed for access/audit. |
| `handoff.md` | Operational documentation | Update this document whenever stack, payment, access, or deployment behavior changes. |

## 5. Data Model and Access Control

The local database does not duplicate Stripe’s transaction ledger. It stores only the business fact that a given site user owns a given digital edition, together with the Stripe session and payment-intent identifiers required for reconciliation.

| Table | Important fields | Why the fields exist |
| --- | --- | --- |
| `users` | `id`, `openId`, `email`, `role` | Identity is created and maintained through the OAuth flow. |
| `purchases` | `userId`, `productId` | Forms the entitlement: **this member can open this edition**. |
| `purchases` | `stripeCheckoutSessionId`, `stripePaymentIntentId` | Provides minimal Stripe traceability without duplicating amounts, card details, invoices, or raw webhook payloads. |

The database enforces unique `(userId, productId)` and `(stripeCheckoutSessionId, productId)` combinations. This makes webhook retries idempotent: a successful repeat delivery cannot grant a second copy of the same entitlement.

> Runtime access is buyer-only. Repository collaborators can still read manuscript source stored in `server/ebookContent.ts`, as they have source-code access. If editorial content must remain hidden from developers, move manuscripts to a separate restricted content service or a private storage system with server-side retrieval.

## 6. Purchase and Reader Workflow

| Step | Actor | What occurs | Security boundary |
| --- | --- | --- | --- |
| 1 | Visitor | Adds catalog IDs to the local cart. | Cart is a convenience state, not proof of ownership. |
| 2 | Member | Signs in before pressing checkout. | `protectedProcedure` supplies the authenticated server user. |
| 3 | Server | Validates each ID and derives line items from `shared/products.ts`. | Client price data is ignored. |
| 4 | Stripe | Hosts payment and returns the visitor to `/library`. | The return URL does not grant access. |
| 5 | Stripe webhook | Server verifies the Stripe signature and records one `purchases` entitlement per edition. | Only signed, paid Stripe events can unlock an edition. |
| 6 | Member | Opens `/library`, then `/read/:productId`. | `library.reader` checks the authenticated user against the `purchases` table before returning chapter content. |

The handler explicitly returns `{ "verified": true }` for Stripe’s `evt_test_` verification events, as required by the current integration setup. For a completed one-time payment it processes `checkout.session.completed`; it also supports `checkout.session.async_payment_succeeded` for payment methods that complete asynchronously.

## 7. Local Development Workflow

Run the following commands from the repository root. The project expects Node.js and pnpm as specified in `package.json`.

| Goal | Command | Expected result |
| --- | --- | --- |
| Install dependencies | `pnpm install` | Installs frontend, server, Stripe, and test packages. |
| Start the app | `pnpm dev` | Starts the Express/Vite development server. |
| Type-check | `pnpm check` | Runs TypeScript with `--noEmit`. |
| Run tests | `pnpm test` | Runs the Vitest suite. |
| Generate migration | `pnpm drizzle-kit generate` | Writes a reviewable SQL file under `drizzle/`. |
| Build production bundle | `pnpm build` | Produces the server/client production bundle. |
| Start production bundle | `pnpm start` | Starts the built Node server. |

Every functional change should follow the same sequence: update the relevant schema or shared contract, implement the server procedure, bind the UI through the typed tRPC hook, add or revise a Vitest case, then run `pnpm test` and `pnpm check`. Make a small, focused commit once the feature is coherent rather than mixing refactors, design work, and payment changes.

## 8. Adding or Editing an Edition

To add an edition, add exactly one product object to `shared/products.ts`, then add the matching reader entry in `server/ebookContent.ts`. The two IDs must be identical. Add a cover image to `/home/ubuntu/webdev-static-assets/`, upload it as a web asset, and use the returned `/manus-storage/...` URL as `coverUrl`. Do not place large image assets inside the repository’s `client/public` or `client/src` directories.

The checkout uses dynamic Stripe `price_data`; therefore a separate Stripe Product or Price is not required for the current one-time-purchase model. The product title, description, USD amount, and product ID still originate exclusively from `shared/products.ts`. If the business later needs subscriptions, tax automation, inventory, regional pricing, or recurring access, define explicit Stripe Products/Prices and extend the source-of-truth model before changing checkout.

## 9. Stripe Setup and Go-Live Checklist

The Stripe integration is configured for a test sandbox. The sandbox must be claimed through the Stripe link shown in the project payment settings before its expiration. For test payment, Stripe’s standard test card is `4242 4242 4242 4242` with any future expiry, any CVC, and any postal code. Do not place live or test secret keys in Git.

| Requirement | Where to configure it | Notes |
| --- | --- | --- |
| Secret key and publishable key | Project payment settings | Provided as runtime environment variables in the managed project. |
| Webhook secret | Project payment settings | Must match the public endpoint’s Stripe Dashboard configuration. |
| Webhook endpoint | Stripe Dashboard → Webhooks | Set to `https://<production-domain>/api/stripe/webhook`. Subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. |
| Production validation | Stripe Dashboard and site | Confirm payment, webhook delivery, database entitlement, library entry, and reader access in that order. |
| Live mode | Stripe Dashboard after account verification | Replace test configuration through payment settings; never commit environment values. |

Stripe requires public webhook endpoints to be HTTPS and signs webhook deliveries; preserve both properties whenever deployment changes.[1] The payment return page is intentionally only a customer experience step. The Stripe Dashboard’s webhook delivery log is the correct first place to inspect an order that has been paid but has not appeared in a library.

## 10. Deployment Runbooks

The source is currently a Node/Express application with database access, OAuth, and a webhook route. It **cannot** be deployed as a static-site export without removing the buyer-only access boundary. Any target must provide an HTTPS server runtime, environment variables, database connectivity, and a route that preserves the raw Stripe webhook body. Stripe requires the endpoint secret, signature header, and raw request bytes to validate a delivery; parsing JSON before verification breaks that contract.[2]

### 10.1 Shared pre-flight for every provider

Before choosing a provider, run `pnpm test`, `pnpm check`, and `pnpm build` in a clean checkout. Set all runtime variables using the provider’s secret manager: `DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY`, and the existing application/analytics variables required by the OAuth template. Do not commit `.env` files or webhook secrets.

The database must be reachable from the provider’s runtime and use TLS where the database service requires it. Reconfigure OAuth callback URLs for the new production origin before enabling sign-in. After the first successful deployment, create the Stripe endpoint `https://<production-domain>/api/stripe/webhook`, select `checkout.session.completed` and `checkout.session.async_payment_succeeded`, and copy that endpoint’s signing secret to the provider’s production secrets. The endpoint should acknowledge valid events quickly with a 2xx response.[2]

### 10.2 Vercel runbook

Vercel Functions can run server-side code in a Node.js runtime and are deployed with the project’s application source.[3] The existing `dist/index.js` Express server is not a static Vercel artifact; migrate the Express entry points to a Vercel Function adapter before selecting this target.

| Step | Action | Verification |
| --- | --- | --- |
| 1 | Import the GitHub repository into a new Vercel project and set Node 22 / pnpm. | Vercel detects the repository and installs dependencies. |
| 2 | Add a Node-compatible function adapter for the application API. Keep `/api/trpc/*`, OAuth callbacks, and `/api/stripe/webhook` behind the adapter. | `GET /` serves the Vite client and `/api/trpc/auth.me` returns a normal tRPC response. |
| 3 | For the webhook function, read `await request.arrayBuffer()` and construct `Buffer.from(...)` before calling `stripe.webhooks.constructEvent`. Never call `request.json()` on this route. | A Stripe test event verifies successfully. |
| 4 | Set the shared pre-flight secrets in Vercel’s Environment Variables for Preview and Production as appropriate. Pin the function region near the database if latency is material. | Login and an authenticated `/library` query work in the deployment. |
| 5 | Use `pnpm build` as the build command. The build does not need `pnpm start` on Vercel because the platform invokes functions. | The deployment finishes with the adapter function present. |
| 6 | Add the production Stripe webhook URL and send a test event from the Stripe Dashboard. | Stripe event delivery shows HTTP 200 and a buyer entitlement is created after a test payment. |

### 10.3 Netlify runbook

Netlify Functions accept web `Request` objects and return `Response` objects; their URL paths can be explicitly configured alongside the function.[4] This project needs a small API adapter because the current runtime is Express, not a Netlify Function.

| Step | Action | Verification |
| --- | --- | --- |
| 1 | Import the GitHub repository into Netlify and set build command `pnpm build`. Publish the Vite output from `dist/public`. | The public storefront is accessible from the Netlify domain. |
| 2 | Move API entry points into `netlify/functions/` or use a maintained Express-to-function adapter. Map `/api/trpc/*` and OAuth routes to their equivalent function paths. | Member sign-in completes and a protected tRPC procedure sees the session. |
| 3 | Create a dedicated `stripe-webhook` function mapped to `/api/stripe/webhook`. Read `Buffer.from(await req.arrayBuffer())`, preserve the `Stripe-Signature` header, verify the event, then process the entitlement. | A test delivery is accepted only when signed correctly. |
| 4 | Configure all shared pre-flight environment variables in Netlify’s environment settings and confirm the database permits the deployed function’s network access. | The library query returns an empty state for a signed-in buyer with no purchases. |
| 5 | Register the exact Netlify endpoint in Stripe and set `STRIPE_WEBHOOK_SECRET` from that endpoint. | A completed test checkout produces one `purchases` row and one library card. |

### 10.4 Cloudflare Workers runbook

Cloudflare Workers is a fetch-style serverless runtime. It can host static assets and API code, but this Node/Express project requires a Worker-compatible rewrite rather than a direct `pnpm start` deployment.[5]

| Step | Action | Verification |
| --- | --- | --- |
| 1 | Create a Worker project and configure static assets from the Vite build output. Use a `fetch(request, env)` entry point for APIs. | Storefront assets resolve from the Worker deployment. |
| 2 | Port tRPC/OAuth routes away from Express middleware to a Workers-compatible router. Replace Node-only request/response assumptions and confirm the selected MySQL/TiDB access layer works in the Worker runtime. | Auth and `/library` function in a Workers preview environment. |
| 3 | Implement `/api/stripe/webhook` with the original `Request`: collect `await request.arrayBuffer()` before parsing, pass the bytes and `request.headers.get("Stripe-Signature")` to Stripe verification, then grant entitlements. | Stripe verification fails for a modified body and passes for a valid test event. |
| 4 | Store `DATABASE_URL`, OAuth variables, and Stripe secrets using Worker secrets; do not put them in `wrangler.toml` or source control. | No secret values appear in source or build output. |
| 5 | Configure the Worker’s public custom domain, update the OAuth callback origin, and register `https://<worker-domain>/api/stripe/webhook` in Stripe. | Sign-in, payment fulfillment, library access, and reader access all succeed in production. |

### 10.5 Generic Node hosting runbook

For a conventional Node host such as Railway, Render, Fly.io, or a container-capable service, the application can run with its existing architecture: install dependencies, run `pnpm build`, then run `pnpm start`. The host must expose the process over HTTPS and inject the shared pre-flight variables. Point Stripe to `/api/stripe/webhook`, then run the same post-deploy payment test. This is the least invasive non-managed-hosting path because it preserves Express, raw-body webhook ordering, and the current server entry point.

For every provider, validate the payment lifecycle in this strict order before launch: sign in; call authenticated `library.list`; add an edition to cart; create a test Checkout Session; complete payment; confirm Stripe delivery; verify the `purchases` row; refresh the library; and open the protected reader. Do not treat a redirect to the success URL as proof that a buyer has been granted access.

## 11. Guardrails for Future Changes

Keep commercial logic on the server. In particular, do not trust product price, currency, entitlement, or reader content authorization sent from a browser. Do not use the cart as a purchase record, do not mark an order paid from a success page, and do not disable Stripe signature verification to make local testing easier.

For database changes, modify `drizzle/schema.ts`, generate a migration, inspect the generated SQL, and apply it through the approved database migration workflow. Avoid destructive migrations unless they are deliberately reviewed and a backup/rollback plan exists. The current test suite should grow with each security-sensitive rule, especially checkout input validation and reader authorization.

## 12. Verified Before Handoff

At the time of this handoff, `pnpm check` completed without TypeScript errors, `pnpm build` completed successfully, and `pnpm test` completed with twelve passing tests across catalog, cart calculations, authentication, checkout validation, webhook entitlement parsing, authenticated library retrieval, and protected reader access. A runtime request to the authenticated endpoint `GET /api/trpc/library.list` also returned HTTP 200 with an expected empty entitlement array for the current signed-in account. Visual review was completed for the desktop storefront, authenticated library state, mobile storefront, and buyer-only reader state. Mobile layout should be rechecked whenever significant copy, navigation, or product-card changes are introduced.

## References

[1] [Stripe, “Receive Stripe events in your webhook endpoint.”](https://docs.stripe.com/webhooks)

[2] [Stripe, “Set up and deploy a webhook.”](https://docs.stripe.com/webhooks/quickstart)

[3] [Vercel, “Vercel Functions.”](https://vercel.com/docs/functions)

[4] [Netlify, “Functions overview.”](https://docs.netlify.com/build/functions/overview/)

[5] [Cloudflare, “Workers overview.”](https://developers.cloudflare.com/workers/)
