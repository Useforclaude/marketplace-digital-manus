# Brightline Marketplace — Engineering Handoff

**Brightline** คือ marketplace ภาษาไทยสำหรับขาย eBook แบบ HTML และคอร์สออนไลน์ โดยมีหน้าร้าน, สมาชิก, ตะกร้าสินค้า, Stripe Checkout, entitlement ของผู้ซื้อ และ reader ที่คืนเนื้อหาจากเซิร์ฟเวอร์เฉพาะเมื่อยืนยันสิทธิ์แล้ว เอกสารนี้เป็นจุดเริ่มต้นสำหรับทีมที่เข้ามาดูแลระบบต่อ

> ระบบนี้เป็น **full-stack commerce application** ไม่ใช่ static landing page เพราะราคา การชำระเงิน การปลดล็อกสิทธิ์ และเนื้อหาที่ซื้อ ต้องตรวจสอบบนเซิร์ฟเวอร์เสมอ

## 1. สถานะปัจจุบันและขอบเขตระบบ

ผู้ใช้เลือกสินค้าได้ทั้ง eBook HTML และคอร์สออนไลน์ เพิ่มสินค้าลงตะกร้า หรือกด “ซื้อเลย” จาก product card ที่มองเห็นชัดเจน ระบบสร้าง Stripe Checkout Session ทางเซิร์ฟเวอร์จากราคาในฐานข้อมูลเท่านั้น เมื่อ webhook ที่เซ็นโดย Stripe ยืนยันการชำระเงิน จึงบันทึก entitlement และปลดล็อกสินค้าใน `/library` ให้กับบัญชีนั้น

| ความสามารถ | สถานะปัจจุบัน | ตำแหน่งหลัก |
| --- | --- | --- |
| หน้าร้านภาษาไทย | Dark editorial storefront, lime–emerald CTA ธีมเดินหมาก, cinematic strategy-board hero; Header แสดง avatar fallback, notification bell และ mobile drawer ที่มี active route โดยทุก role เห็น navigation/CTA ที่ต่างกัน | `client/src/pages/Home.tsx`, `client/src/components/StoreHeader.tsx`, `client/src/components/MobileNavigationDrawer.tsx`, `client/src/components/NotificationBell.tsx` |
| การแจ้งเตือน | Bell แสดงรายการของบัญชีปัจจุบัน, unread badge, อ่านรายการ/อ่านทั้งหมด; ผู้ใช้เปิด/ปิด product, purchase และ system categories ได้เอง; product/purchase/broadcast เคารพ opt-out และ href ชี้ไปยังสินค้า, reader หรือ path ภายในที่เกี่ยวข้อง | `notifications`, `notification_preferences`, `server/db.ts`, `server/routers.ts`, `client/src/components/NotificationBell.tsx`, `client/src/pages/MemberDashboard.tsx` |
| Social proof | แสดง feedback เฉพาะผู้เรียนที่ซื้อจริง, ยินยอม และผ่านการอนุมัติแล้ว; หากยังไม่มีข้อมูลจะใช้ empty state ที่โปร่งใส โดยไม่มีข้อมูลตัวอย่างหรือคำยืนยันที่สร้างขึ้น | `client/src/pages/homeContent.ts`, `client/src/pages/Home.tsx`, `server/routers.ts` |
| Testimonial moderation | ผู้เรียนส่ง feedback จากสินค้าที่ตนซื้อพร้อม consent; admin เปลี่ยนสถานะเป็น `approved`, `hidden`, `rejected` หรือ `pending` ได้ | `testimonials`, `client/src/pages/MemberDashboard.tsx`, `client/src/pages/Admin.tsx` |
| สินค้าดิจิทัล | รองรับ `ebook`, `course` และ `bundle`; Bundle เป็นรายการขายเดียวที่ปลดล็อกทุกสินค้าภายใน | `store_products`, `bundles`, `bundle_items`, `drizzle/schema.ts` |
| หลังบ้านผู้ดูแล | สร้าง/แก้ไขสินค้าและ Bundle, ตั้งราคา/หน้าปก/สถานะ, เลือกสินค้าในชุด, ดู entitlement, กลั่นกรอง testimonial และส่งประกาศระบบ | `client/src/pages/Admin.tsx`, `server/routers.ts` |
| รูปหน้าปก | อัปโหลดผ่าน server เฉพาะ admin, จำกัด MIME และขนาดไฟล์ | `admin.uploadCover`, `server/storage.ts` |
| สมาชิก | Manus OAuth และ signed session cookie | `server/_core/`, `client/src/_core/hooks/useAuth.ts` |
| Dashboard สมาชิก | สรุป entitlement, เข้า eBook/คอร์สโดยตรง และดูประวัติคำสั่งซื้อของบัญชีตนเอง | `client/src/pages/MemberDashboard.tsx`, `/dashboard` |
| ตะกร้า | localStorage สำหรับ UX เท่านั้น ไม่ใช่หลักฐานการซื้อ | `client/src/contexts/CartContext.tsx` |
| การชำระเงิน | Stripe Checkout Session จากสินค้า published ในฐานข้อมูล | `server/stripe.ts` |
| การปลดล็อก | Stripe webhook ที่ตรวจ signature สร้าง entitlement ใน `purchases` | `server/stripeWebhook.ts` |
| เนื้อหาผู้ซื้อ | reader เรียก content ผ่าน API หลังตรวจ entitlement | `server/routers.ts`, `client/src/pages/Reader.tsx` |
| Security | CSP, HSTS production, origin check, API/per-user rate limit, Zod validation และ server-side RBAC | `server/_core/index.ts`, `server/security.ts` |

## 2. Technology Stack

| Layer | Technology | หน้าที่ |
| --- | --- | --- |
| Frontend | React 19, TypeScript, Vite, Wouter | storefront, cart, library, reader และ admin routes |
| Styling | Tailwind CSS 4, custom CSS, Manrope, Playfair Display, DM Mono | dark UI, lime–emerald gradients, responsive และ IntersectionObserver/reduced-motion support |
| UI primitives | shadcn/ui foundation, Lucide, Sonner | interaction patterns, icons และ notifications |
| API | Express 4, tRPC 11, Zod | typed API และ validation ที่ `/api/trpc` |
| Auth | Manus OAuth | สมาชิก, signed session และ user role |
| Database | MySQL/TiDB, Drizzle ORM | users, products และ purchase entitlements |
| Storage | S3-compatible storage helper | เก็บรูปหน้าปกและคืน `/manus-storage/...` URL |
| Payments | Stripe Checkout + signed webhook | ชำระเงินและ fulfillment |
| Tests | Vitest | unit tests สำหรับ checkout, admin, security, cart และ entitlements |

## 3. Architecture and Data Flow

```mermaid
flowchart LR
  V[ผู้เข้าชม] --> S[React storefront]
  S --> C[Cart localStorage]
  S --> A[Manus OAuth]
  A --> T[tRPC API]
  C --> T
  T --> P[(store_products)]
  T --> SC[Stripe Checkout Session]
  SC --> ST[Stripe hosted checkout]
  ST --> WH[/api/stripe/webhook]
  WH --> E[(purchases entitlement)]
  E --> T
  T --> L[Protected library / reader]
  L --> V
  AD[Admin] --> T
  AD --> U[Validated cover upload]
  U --> S3[Private storage workflow]
```

เบราว์เซอร์ส่งเพียง `productId` และ `quantity` เข้าสู่ checkout API เท่านั้น `server/stripe.ts` โหลดสินค้า **published** จาก `store_products` และสร้าง `price_data` จาก `priceSatang` ที่เชื่อถือได้ จึงไม่สามารถแก้ราคาใน DevTools หรือผ่าน request ที่ถูกดัดแปลงเพื่อสร้าง Checkout Session ในราคาปลอมได้

Stripe ยืนยันการชำระเงินผ่าน webhook แทนการเชื่อ redirect หน้า success เพราะ redirect เป็นเพียงประสบการณ์ผู้ใช้ ไม่ใช่หลักฐานการจ่ายเงิน ระบบตรวจลายเซ็นและ raw request body ก่อนสร้าง entitlement ตามแนวทาง Stripe [1] [2]

## 4. Repository Map

| Path | หน้าที่ | ข้อควรระวังในการดูแล |
| --- | --- | --- |
| `client/src/pages/Home.tsx` | หน้า storefront ภาษาไทย | Hero CTA ต้องใช้ `storefrontAccess.ts` เพื่อแสดง “เลือกหมากตัวแรกของคุณ” แก่ visitor/user, ทางเข้าคลังให้ member และทางเข้าหลังบ้านให้ admin; product cards รวม Bundle และมี `#product-<slug>` anchor สำหรับ notification deep link; social proof ต้อง query ได้เพียง approved+consented feedback |
| `client/src/components/StoreHeader.tsx` | navigation และ account identity ตาม role | ห้าม render `/admin` ให้ visitor/user/member; desktop แสดง avatar fallback จากอักษรแรกของชื่อ/อีเมล, ชื่อบัญชี และ destination ที่ถูกต้อง; mobile เปิด drawer แทนการซ่อนเมนูทั้งหมด |
| `client/src/components/MobileNavigationDrawer.tsx` | mobile navigation ตาม role | ใช้ `storefrontAccess.ts` โดยตรง เพื่อป้องกัน desktop/mobile แสดงเมนูไม่ตรงกัน; visitor เห็น login CTA, member เห็นคลัง และ admin เห็นจัดการร้าน |
| `client/src/components/NotificationBell.tsx` | notification feed ใน Header | query/mutation ผ่าน `notifications.*` เท่านั้น; ห้ามแสดงรายการของ user อื่นหรือ hardcode ข้อความว่าเป็น message/product update |
| `client/src/components/storefrontAccess.ts` | pure role-aware storefront policy | source of truth ของ label/href สำหรับ visitor, user, member และ admin; ต้องเพิ่ม unit test เมื่อแก้ rule หรือ CTA |
| `client/src/pages/homeContent.ts` | hero asset, headline alternatives และ copy/structure ของ social proof | เก็บ URL hero, `HERO_HEADLINE_OPTIONS` และ social-proof disclosure ให้เป็น pure content ที่ test ได้; ห้ามใส่ชื่อ, คำพูด, rating, outcome metric หรือข้อมูลตัวอย่างที่อาจถูกมองเป็นรีวิวจริง |
| `client/src/pages/MemberDashboard.tsx` | Dashboard สมาชิก, form ส่ง feedback และ preferences | รับ feedback เฉพาะจากสินค้าที่ซื้อ; ต้องติ๊ก consent ก่อนส่ง; สิ่งที่ผู้ใช้ส่งใหม่กลับสู่ `pending` เสมอ; preferences อัปเดตได้เฉพาะ current user |
| `client/src/hooks/useScrollReveal.ts` | scroll-reveal behavior | เพิ่ม `.is-visible` เมื่อ block เข้าสู่ viewport; reduced-motion และ browser ที่ไม่มี observer จะเห็นเนื้อหาทันที |
| `client/src/pages/Admin.tsx` | หลังบ้านสินค้า Bundle คำสั่งซื้อ และประกาศ | UI ไม่ใช่ security boundary; server `adminProcedure` คือ boundary จริง; รองรับ `?tab=bundles` และ `?tab=notifications` สำหรับเปิด surface ที่เกี่ยวข้องโดยตรง |
| `client/src/pages/Library.tsx` | คลังส่วนตัว | แสดงเฉพาะ entitlement ของ current user |
| `client/src/pages/MemberDashboard.tsx` | Dashboard สมาชิก | รวมคลัง, ปุ่มเปิดอ่าน/เรียน, summary และประวัติ entitlement โดยไม่รับ content จาก public catalog |
| `client/src/pages/memberDashboardUtils.ts` | สรุปจำนวน eBook/คอร์ส | เป็น pure utility ที่มี unit test; รักษา behavior empty state และ count ให้ถูกต้อง |
| `client/src/pages/Reader.tsx` | eBook/course reader | ห้ามย้าย content เข้า public static bundle หรือ `dangerouslySetInnerHTML` |
| `client/src/App.tsx` | route-level role redirect + feedback | ใช้ `routeAccess.ts` กำหนด destination และข้อความเหตุผล; แสดง Sonner toast หนึ่งครั้งก่อนนำ visitor/user/member/admin ไปยังพื้นที่ที่อนุญาต; server RBAC ยังคงเป็น security boundary |
| `client/src/components/routeAccess.ts` | pure redirect notice policy | รวม destination, title และ description ของ route redirect เพื่อให้ UI feedback และ tests ตรงกัน |
| `notifications` / notification helpers | notification ต่อผู้ใช้ | `userId` เป็น ownership boundary; list/mark read filter ตาม current user เสมอ, product/system broadcast filter ตาม preferences และ admin broadcast ถูกคุมด้วย `adminProcedure` + rate limit |
| `bundles` / `bundle_items` | แพ็กสินค้าแบบมีราคาของตนเอง | Bundle เก็บ metadata/ราคา; item relation เก็บ product slugs ที่ต้อง expand เป็น entitlement, โดยไม่สร้าง entitlement ให้ bundle slug |
| `client/src/contexts/CartContext.tsx` | cart ฝั่ง browser | ห้ามถือว่า cart เป็น order, payment หรือ entitlement |
| `client/src/data/catalog.ts` | type/formatter ฝั่ง client | ห้าม hardcode ราคา หรือ manuscript ใน client |
| `drizzle/schema.ts` | schema ที่เป็น source of truth | แก้ schema → generate migration → review SQL → apply migration |
| `server/defaultProducts.ts` | seed catalog สำหรับ environment ใหม่ | ใช้เฉพาะ seed idempotent และไม่ overwrite การแก้ไขของ admin |
| `server/db.ts` | persistence and queries | แยก public product mapping ออกจาก product record ที่มี content |
| `server/products.ts` | public product boundary | `toPublicProduct()` ต้องไม่คืน `content`, `coverKey` หรือ persistence fields |
| `server/routers.ts` | catalog, checkout, library, admin tRPC APIs | ทุก mutation ต้องผ่าน Zod และ procedure ที่เหมาะสม |
| `server/stripe.ts` | Stripe checkout creation | ห้ามรับราคา, currency หรือ description จาก browser |
| `server/stripeWebhook.ts` | signature verification และ entitlement fulfillment | คง raw-body route ordering เสมอ |
| `testimonials` / testimonial helpers | feedback จากผู้ซื้อจริงและ moderation status | public query ต้อง filter `status = approved` และ `consentToPublish = true`; ห้าม seed หรือ hardcode testimonial |
| `server/security.ts` | per-user mutation limiter | เป็น in-process limit; production ควรเสริม WAF/provider rate limiting |
| `server/_core/index.ts` | Express headers, parser limits, origin guard, route mounting | อย่าสลับลำดับ Stripe raw route กับ JSON parser |
| `handoff.md` | คู่มือระบบ | อัปเดตทุกครั้งที่เปลี่ยน payment, auth, access หรือ deploy behavior |

## 5. Data Model

| Table | Fields สำคัญ | ความหมาย |
| --- | --- | --- |
| `users` | `id`, `openId`, `email`, `role` | identity จาก OAuth; role มี `user` และ `admin` |
| `store_products` | `slug`, `productType`, `status`, `priceSatang`, `currency` | catalog ที่ admin แก้ไขได้ และเป็น source of truth ด้านการขาย |
| `store_products` | `coverUrl`, `coverKey`, `content` | metadata รูปปกและ paid content; `content` ห้ามคืนจาก public catalog |
| `purchases` | `userId`, `productId` | entitlement: สมาชิกนี้เปิดสินค้านี้ได้ |
| `purchases` | `stripeCheckoutSessionId`, `stripePaymentIntentId` | identifiers ที่จำเป็นต่อ reconciliation โดยไม่คัดลอกข้อมูลบัตรหรือ transaction ledger |
| `testimonials` | `userId`, `productId`, `displayName`, `feedback`, `consentToPublish`, `status` | feedback ต่อผู้ซื้อ/สินค้าหนึ่งรายการ; ไม่ public จนได้รับ consent และ admin อนุมัติ |
| `notifications` | `userId`, `kind`, `title`, `body`, `href`, `readAt` | notification เฉพาะบัญชี; `kind` มี `product`, `purchase`, `system`; `readAt = NULL` คือยังไม่อ่าน |
| `notification_preferences` | `userId`, `productEnabled`, `purchaseEnabled`, `systemEnabled` | opt-in/out ต่อประเภท; หากไม่มี row ให้ใช้ default `true` ทุกประเภท |
| `bundles` | `slug`, `status`, `title`, `coverUrl`, `priceSatang`, `currency` | product package ที่ผู้ดูแลตั้งราคาและเผยแพร่ได้ |
| `bundle_items` | `bundleSlug`, `productId` | relation ที่มี unique `(bundleSlug, productId)`; server ตรวจว่าทุก product มีจริงก่อนบันทึก |

`purchases` มี unique combinations ที่ช่วยให้ webhook retry เป็น idempotent และไม่ปลดล็อกสิทธิ์ซ้ำสำหรับสินค้า/checkout session เดิม

## 6. Admin Workflow

ผู้ดูแลเข้า `/admin` ด้วยบัญชีที่มี `role = 'admin'` เท่านั้น หน้า admin มี product list, edit form และ order table

| งาน | วิธีทำ | Server guard |
| --- | --- | --- |
| สร้างสินค้า | กด “สร้างสินค้าใหม่”, กรอก slug, ราคาบาท, cover, content JSON และสถานะ | `adminProcedure`, Zod, per-user rate limit |
| แก้ราคา/รายละเอียด | เลือก “แก้ไข” แล้วบันทึก | server revalidates payload; slug ของสินค้าที่มีอยู่เปลี่ยนไม่ได้ |
| อัปโหลดหน้าปก | ใช้ PNG/JPG/WebP ไม่เกิน 3 MB | admin-only, MIME data URL validation, size check, storage upload |
| เผยแพร่สินค้า | เปลี่ยน status เป็น `published` | checkout จะโหลดเฉพาะสินค้า published |
| ปิดขายชั่วคราว | เปลี่ยน status เป็น `draft` หรือ `archived` | สินค้าไม่สามารถเข้าสู่ checkout ใหม่ได้ |
| ดูคำสั่งซื้อ | เปิด tab “คำสั่งซื้อ” | แสดง entitlement ที่ webhook ยืนยันแล้วเท่านั้น |
| สร้างหรือแก้ Bundle | เปิด tab “Bundle”, เลือกอย่างน้อย 2 สินค้า, ตั้งราคา/หน้าปก/สถานะ | `adminProcedure`, Zod, product existence validation; Bundle ที่ publish ต้องมีเฉพาะสินค้าที่ publish แล้ว |
| ส่งประกาศ | เปิด tab “ประกาศ”, ระบุหัวข้อ ข้อความ และ internal path | `adminProcedure`, Zod internal-href guard, 12 broadcasts/hour/admin; ส่งเฉพาะผู้เปิด `systemEnabled` |

### Product content format

content เก็บเป็น JSON string เพื่อให้ API ตรวจ structure ได้ก่อนเขียนฐานข้อมูล

```json
{
  "kind": "ebook",
  "intro": "คำเกริ่นนำ",
  "chapters": [
    { "kicker": "บทที่ 01", "title": "ชื่อบท", "body": ["ย่อหน้าแรก"] }
  ]
}
```

```json
{
  "kind": "course",
  "intro": "คำเกริ่นนำคอร์ส",
  "modules": [
    { "title": "บทเรียนที่ 1", "duration": "30 นาที", "summary": "ผลลัพธ์ที่ผู้เรียนจะได้รับ" }
  ]
}
```

## 7. Purchase, Entitlement and Reader Workflow

| ลำดับ | ผู้กระทำ | เหตุการณ์ | Boundary |
| --- | --- | --- | --- |
| 1 | ผู้เข้าชม | เพิ่ม slug และจำนวนเข้าตะกร้า | cart เป็น convenience state เท่านั้น |
| 2 | สมาชิก | ลงชื่อเข้าใช้แล้วเริ่ม checkout | `protectedProcedure` ผูก action กับ current user |
| 3 | Server | validate cart และโหลด product/Bundle published จาก DB | ราคา/สินค้าใน browser ถูกละเลย; Bundle expand เป็น product IDs ภายในเท่านั้น |
| 4 | Stripe | แสดง hosted checkout | ไม่มี payment data ผ่าน app server |
| 5 | Stripe webhook | ตรวจ signature และ payment status แล้วเรียก `grantPurchaseAccess` ต่อ product ID | เฉพาะ Stripe event ที่ตรวจแล้วปลดล็อกได้; Bundle ไม่สร้าง entitlement ให้ bundle slug |
| 6 | สมาชิก | เปิด `/library` และ `/read/:productId` | server ตรวจ `purchases` ก่อนคืน `content` |

การเปิด DevTools, Inspect Element หรือดู JavaScript bundle ทำได้ตามธรรมชาติของเว็บ แต่ **ไม่ทำให้ผู้ใช้ได้รับสิทธิ์เพิ่มหรือแก้ข้อมูลในระบบได้** เพราะ entitlement, ราคา, role และ content verification อยู่ที่ server/database การป้องกันที่ถูกต้องคือไม่ส่ง paid manuscript, secrets หรือ admin privileges ไปยัง client ตั้งแต่แรก ไม่ใช่พยายาม “ปิด Inspect” ซึ่งไม่ใช่ security control

## 8. Security Model

| ความเสี่ยง | การป้องกันที่มี | หมายเหตุ |
| --- | --- | --- |
| แก้ราคาใน client | checkout resolves DB products on server | client values ไม่มีราคา/currency |
| เปิดเนื้อหาฟรี | `library.reader` checks auth + entitlement ก่อนส่ง content | public catalog ส่งเฉพาะ metadata |
| ปลอม payment success | Stripe raw webhook signature verification | redirect `/library?checkout=success` ไม่ปลดล็อกสิทธิ์ |
| ข้ามสิทธิ์ admin | `adminProcedure` checks `ctx.user.role` ทุก endpoint | client admin page เป็นเพียง UX layer |
| เห็น tab/CTA ข้ามบทบาท | `storefrontAccess.ts`, `StoreHeader`, mobile drawer และ route redirect | admin route ไม่อยู่ใน navigation ของ visitor/user/member ทั้ง desktop/mobile; drawer highlight จาก current route โดยไม่เปลี่ยน policy, และ server `adminProcedure` ยังคงปฏิเสธ direct API calls |
| อ่านหรือแก้ notification ของผู้อื่น | `notifications.*` protected procedures + `userId` filter | Browser ส่งได้เพียง notification id; DB update บังคับ `id` และ `userId = current user` ร่วมกัน, admin broadcast ใช้ `adminProcedure` |
| ข้ามราคา/สิทธิ์ของ Bundle | checkout resolve Bundle และ items จาก DB | browser ส่งได้เพียง bundle slug/quantity; server ใช้ราคาแพ็กและ Stripe metadata เก็บ product IDs ที่ expand แล้ว |
| ส่งข้อมูลผิดรูป | Zod validation และ content schema checks | slug, price, status, content, upload ถูกตรวจ server-side |
| spam/abuse | API IP window, checkout/admin per-user windows | production ควรเปิด WAF/rate limits ของ hosting เพิ่ม |
| cross-site mutation | same-origin check สำหรับ state-changing tRPC requests | webhook อยู่ก่อน guard และตรวจ Stripe signature เอง |
| oversized upload | 5 MB JSON cap, 3 MB raw image cap, allowed MIME | uploads ผ่าน admin only |
| รีวิวปลอมหรือเผยแพร่โดยไม่ยินยอม | submit ต้องผ่าน purchase entitlement + explicit consent; public query filter approved/consented; adminProcedure คุม moderation | ห้าม seed/mock/hardcode testimonial, rating หรือ outcome metric ใน code/fixtures/copy |
| clickjacking/unsafe browser features | CSP, X-Frame-Options, Permissions-Policy | production ใช้ `frame-ancestors 'none'` และ `X-Frame-Options: DENY`; development allowlist เฉพาะ `manus.im`/`manus.com` เพื่อให้ Managed Preview แสดงผลได้ |
| insecure transport | `Strict-Transport-Security` เฉพาะ production | hosting ต้อง serve HTTPS |

### ข้อจำกัดที่ต้องรับรู้

ไม่มีเว็บใดรับประกันได้ว่า “เจาะไม่ได้ 100%” ทีมต้อง patch dependencies, rotate secrets, review Stripe events และใช้ WAF/observability ของ hosting ต่อเนื่อง หากเนื้อหาต้องซ่อนแม้จาก repository collaborators ให้นำ manuscript ออกจาก source control และดึงจาก storage/service ที่จำกัดสิทธิ์ทาง server แทน

### Preview policy

Manus Preview ต้อง render เว็บไซต์ใน managed frame ระหว่างพัฒนา ดังนั้น development CSP จึงอนุญาต `frame-ancestors` เฉพาะ `https://manus.im`, subdomains ของ `manus.im`, `https://manus.com` และ subdomains ของ `manus.com` โดยไม่มี `X-Frame-Options` ซึ่งไม่รองรับ allowlist เมื่อ build/run ด้วย `NODE_ENV=production` ระบบกลับไปใช้ `frame-ancestors 'none'` และ `X-Frame-Options: DENY` ทันที ห้ามย้าย allowlist สำหรับ Preview ไปยัง production

## 9. Copywriting Direction

หน้า storefront ใช้ conversion copywriting ที่ให้ **ความชัดเจนมาก่อนคำคม**: Hero ปัจจุบันสื่อกับคนที่รู้ว่าตัวเองไปได้ไกลกว่านี้ แต่ยังไม่มีเส้นทางชัดเจน และใช้กระดานกลยุทธ์ที่วางฟิกเกอร์บุคคลสมมติหลายบทบาทไว้บนฐานหมาก ได้แก่ CEO, Marketing, Programmer, Finance และ Sales โดยมือ mentor ยกฟิกเกอร์ CEO ให้ลอยอยู่เหนือกระดาน เพื่อสื่อถึงช่วงคิดก่อนตัดสินใจและการมองเห็นบทบาทของทีม ไม่ใช่การรับประกัน “เคล็ดลับ” หรือความสำเร็จ Hero ที่เลือกใช้คือ “ก่อนจะวางหมากแรก / คุณต้องอ่านเกมให้ออก” และเก็บตัวเลือกภาษาไทยอีกสองแบบไว้ใน `HERO_HEADLINE_OPTIONS` เพื่อเปรียบเทียบในอนาคต ภาพเป็นตัวละครต้นฉบับ ไม่สื่อว่าเกี่ยวข้องกับผู้มีชื่อเสียงจริง และเว้นด้านซ้ายเป็น text-safe area เสมอ eBook และคอร์สจึงถูกวางเป็น “บันไดขั้นแรก” เพื่อเปลี่ยนความตั้งใจให้เป็นทักษะ การตัดสินใจ และก้าวที่ทำได้จริง แต่ละ section ผลักเหตุผลเดียว—ความรู้สึกติดอยู่, ทางเลือกสินค้า, วิธีได้รับสิทธิ์ และการลงมือเลือก—เพื่อลดความลังเลก่อนซื้อ [6] [7]

ส่วน “ผลลัพธ์จากผู้เรียน” ใช้หลัก **social proof ที่รอหลักฐาน ไม่ใช่การสร้างหลักฐาน**: สมาชิกส่ง feedback ได้เฉพาะสินค้าที่มี entitlement และต้องติ๊ก consent ที่ชัดเจนทุกครั้ง ผลงานใหม่เข้า `pending` และแสดงในหลังบ้านให้ admin อนุมัติ, ซ่อน, ปฏิเสธ หรือส่งกลับเป็นรอตรวจ เมื่อ public API จะคืนเฉพาะ `approved` + `consentToPublish = true` เท่านั้น ห้ามเติม quote, ชื่อบุคคล, คะแนนดาว, ตัวเลขผลลัพธ์ หรือ testimonial จำลองไม่ว่ากรณีใด

## 10. Local Development Workflow

| เป้าหมาย | คำสั่ง | ผลลัพธ์ |
| --- | --- | --- |
| ติดตั้ง dependency | `pnpm install` | ติดตั้ง frontend, server, Stripe และ tooling |
| เปิด dev server | `pnpm dev` | เริ่ม Express/Vite |
| ตรวจ TypeScript | `pnpm check` | รัน `tsc --noEmit` |
| รัน tests | `pnpm test` | รัน Vitest |
| สร้าง migration | `pnpm drizzle-kit generate` | SQL ใหม่ใต้ `drizzle/` |
| build production | `pnpm build` | สร้าง Vite client และ Express bundle |
| run production | `pnpm start` | เปิด bundle ที่ build แล้ว |

หลังเปลี่ยน schema ให้ทำตามลำดับ: แก้ `drizzle/schema.ts` → `pnpm drizzle-kit generate` → review SQL → apply migration → เพิ่ม test → `pnpm test && pnpm check && pnpm build`

### Branch และ rollback workflow

ให้แยก branch เมื่อเป็นงานที่เปลี่ยน flow หรือหน้าหลักของผู้ใช้ เช่น `feature/member-dashboard-brand-refresh` และแบ่ง commit ตามหน่วยงานที่ย้อนกลับได้เอง: โครงสร้าง/route, visual-copy, และ test/docs ทุกครั้งที่จบส่วนย่อยให้ run checks ที่เกี่ยวข้องก่อน commit ใช้ checkpoint ของ Manus สำหรับ rollback ระดับโปรเจกต์ และใช้ Git branch/commit สำหรับ review หรือย้อนเฉพาะชุดงาน ห้ามใช้ `git reset --hard` กับ working tree ของโปรเจกต์

## 11. Stripe Setup and Go-Live

Stripe sandbox ของโปรเจกต์ต้องถูก claim ก่อนใช้งานทดสอบจริง ห้าม commit secret keys, webhook secret หรือ `.env`

| Requirement | ที่ตั้งค่า | หมายเหตุ |
| --- | --- | --- |
| Stripe secret/publishable key | Project payment settings | injected เป็น runtime env |
| Webhook secret | Project payment settings | ต้องตรงกับ endpoint ใน Stripe Dashboard |
| Webhook URL | Stripe Dashboard → Webhooks | `https://<domain>/api/stripe/webhook` |
| Event ที่ใช้ | Stripe Dashboard | `checkout.session.completed`, `checkout.session.async_payment_succeeded` |
| ทดสอบ payment | Stripe test mode | ใช้ card `4242 4242 4242 4242` พร้อม expiry ในอนาคต |

ทุกครั้งที่เปลี่ยน domain ต้องอัปเดต OAuth callback, Stripe webhook URL, secret และทดสอบ flow ตามลำดับ: login → add to cart → checkout → Stripe event delivery → `purchases` entitlement → library → reader [1] [2]

## 12. Deployment Notes

โปรเจกต์นี้เป็น Node/Express app ที่มี OAuth, database และ raw Stripe webhook จึง **ไม่สามารถ deploy เป็น static export เพียงอย่างเดียว** หากย้ายไป Vercel, Netlify หรือ Cloudflare ต้องเขียน adapter/port runtime ให้รักษา `/api/trpc/*`, OAuth routes และ raw body ของ `/api/stripe/webhook` ไว้ การใช้ generic Node host (Railway, Render, Fly.io หรือ container runtime) เปลี่ยนแปลงน้อยที่สุด: `pnpm build` แล้ว `pnpm start`

| Provider | แนวทาง | จุดที่ต้องตรวจ |
| --- | --- | --- |
| Vercel | port Express เป็น Node Functions | webhook ใช้ `arrayBuffer()` ก่อน verify signature [3] |
| Netlify | port API เป็น Functions หรือ Express adapter | map `/api/stripe/webhook` และ preserve raw body [4] |
| Cloudflare | rewrite เป็น Worker-compatible fetch runtime | อย่าใช้ Express/Node APIs ที่ Worker ไม่รองรับ [5] |
| Generic Node host | ใช้ Express architecture เดิม | inject secrets, TLS database, HTTPS domain |

### Environment checklist

ตั้งค่าใน secret manager ของ provider เท่านั้น: `DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY` รวมถึง environment variables ของ OAuth/analytics ที่ template ต้องใช้

## 13. Verified Before This Handoff

ณ รอบการส่งต่องานนี้ `pnpm test` ผ่าน **60 tests**, `pnpm check` ผ่าน และ `pnpm build` สำเร็จแล้ว ครอบคลุม cart, checkout DB price guard, Bundle server-side price/entitlement expansion, Stripe fulfillment, member-only reader, admin RBAC และ Bundle validation/selection/edit state, notification ownership/preferences และ interaction payloads, rendered product/reader deep links, Admin Bundle/Broadcast UI surfaces, storefront Bundle card, malformed content/upload rejection, rate limit, public-content boundary, scroll-reveal fallback, IntersectionObserver reveal/cleanup, Dashboard summary, social-proof disclosure, testimonial consent/ownership/moderation RBAC, strategy hero content, role-aware CTA policy, redirect notice policy, UI-level StoreHeader/Hero CTA และ mobile drawer สำหรับ visitor/user/member/admin และ component-level Dashboard states หน้าร้านและ Dashboard ได้รับการตรวจบน desktop/mobile; Managed Preview ได้รับการยืนยันด้วย development CSP allowlist และ HTTP response 200 แล้ว

## References

[1] [Stripe, “Receive Stripe events in your webhook endpoint.”](https://docs.stripe.com/webhooks)

[2] [Stripe, “Set up and deploy a webhook.”](https://docs.stripe.com/webhooks/quickstart)

[3] [Vercel, “Vercel Functions.”](https://vercel.com/docs/functions)

[4] [Netlify, “Functions overview.”](https://docs.netlify.com/build/functions/overview/)

[5] [Cloudflare, “Workers overview.”](https://developers.cloudflare.com/workers/)

[6] [Corey Haines, “Copywriting Skill.”](https://github.com/coreyhaines31/marketingskills/blob/main/skills/copywriting/SKILL.md)

[7] [Stripe Atlas, “Writing copy for landing pages.”](https://stripe.com/guides/atlas/landing-page-copy)
