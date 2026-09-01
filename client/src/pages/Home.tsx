import { useAuth } from "@/_core/hooks/useAuth";
import { StoreHeader } from "@/components/StoreHeader";
import { CheckoutOfferDialog } from "@/components/CheckoutOfferDialog";
import { getStorefrontExperience } from "@/components/storefrontAccess";
import { StorefrontHeroActionsV2 } from "@/components/StorefrontHeroActionsV2";
import { startLogin } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency, formatProductType } from "@/data/catalog";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { trpc } from "@/lib/trpc";
import { ACTIVE_HERO_HEADLINE, HOME_HERO_IMAGE, SOCIAL_PROOF } from "@/pages/homeContent";
import { ArrowDown, ArrowDownRight, BadgeCheck, Eye, Infinity as InfinityIcon, Library, Minus, Plus, ShieldCheck, ShoppingBag, Sparkles, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

/** Editorial ownership story — numbered rows instead of cards, in buy order. */
const OWNERSHIP_STEPS = [
  { number: "01", title: "เลือกจากปัญหาจริง", copy: "เริ่มที่เรื่องเดียวที่คุณอยากทำให้ชัดขึ้น ไม่ต้องซื้อทั้งชั้น" },
  { number: "02", title: "ชำระอย่างมั่นใจ", copy: "เข้าสู่ระบบก่อนชำระ สิทธิ์จะผูกกับบัญชีของคุณโดยตรง" },
  { number: "03", title: "กลับมาใช้ตอนจำเป็น", copy: "เปิด eBook หรือเรียนคอร์สต่อใน Dashboard ของคุณได้ทุกเมื่อ" },
];

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutIntent, setCheckoutIntent] = useState<{ items: { productId: string; quantity: number }[]; sourceProductId: string } | null>(null);
  const catalog = trpc.catalog.list.useQuery();
  const approvedTestimonials = trpc.testimonials.listApproved.useQuery();
  const { addItem, itemCount, items, removeItem, setQuantity, subtotal, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const memberLibrary = trpc.library.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role !== "admin",
  });
  const checkout = trpc.commerce.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank", "noopener,noreferrer");
      clearCart();
      toast.success("กำลังเปิดหน้าชำระเงิน", { description: "ชำระผ่าน Stripe ในแท็บใหม่ แล้วสินค้าจะเข้าคลังของคุณทันที" });
    },
    onError: (error) => toast.error("ยังเริ่มชำระเงินไม่ได้", { description: error.message || "กรุณาลองใหม่อีกครั้ง" }),
  });
  const checkoutOffers = trpc.commerce.offers.useQuery({ sourceProductId: checkoutIntent?.sourceProductId ?? "__none__" }, { enabled: Boolean(checkoutIntent?.sourceProductId) });

  const products = catalog.data ?? [];
  const learnerProof = approvedTestimonials.data ?? [];
  const storefrontExperience = getStorefrontExperience({
    isAuthenticated,
    role: user?.role,
    ownedItemCount: memberLibrary.data?.length ?? 0,
  });
  useScrollReveal(products.length);
  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('article[id^="product-"]'));
    const cleanups = cards.map((card) => {
      card.classList.add("cursor-pointer");
      const openDetail = (event: MouseEvent) => {
        const target = event.target;
        if (!(target instanceof Element) || target.closest("button, a")) return;
        const slug = card.id.replace(/^product-/, "");
        if (slug) window.location.assign(`/product/${slug}`);
      };
      card.addEventListener("click", openDetail);
      return () => card.removeEventListener("click", openDetail);
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [products.length]);
  const addToCart = (slug: string) => {
    addItem(slug);
    toast.success("เพิ่มลงตะกร้าแล้ว", { description: "คุณสามารถตรวจสอบรายการได้ที่ไอคอนตะกร้าด้านบน" });
  };

  const startCheckout = (checkoutItems = items.map(({ productId, quantity }) => ({ productId, quantity }))) => {
    if (!checkoutItems.length) return;
    if (!isAuthenticated) {
      toast.message("เข้าสู่ระบบเพื่อเก็บสิทธิ์ของคุณ", { description: "สินค้าที่ซื้อจะปลดล็อกเฉพาะบัญชีที่ลงชื่อเข้าใช้" });
      startLogin();
      return;
    }
    setCheckoutIntent({ items: checkoutItems, sourceProductId: checkoutItems[0].productId });
  };

  return (
    <div className="v2-paper v2-sans min-h-screen">
      <StoreHeader onOpenCart={() => setCartOpen(true)} />
      <main>
        {/* HERO — one promise, one vermillion commitment, framed print poster */}
        <section className="relative overflow-hidden">
          <div className="container grid gap-14 py-16 sm:py-20 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:py-24">
            <div className="reveal">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="h-[2px] w-10 bg-[#c8431d]" />
                <span className="v2-kicker v2-accent">{ACTIVE_HERO_HEADLINE.eyebrow}</span>
              </div>
              <h1 className="v2-serif mt-7 text-[clamp(2.8rem,5.6vw,5.2rem)] font-semibold leading-[1.06] tracking-[-0.015em]">
                {ACTIVE_HERO_HEADLINE.lead}
                <br />
                <em className="v2-accent">{ACTIVE_HERO_HEADLINE.highlight}</em>
              </h1>
              <p className="mt-7 max-w-xl text-[15px] leading-8 text-[#211c14]/72">{ACTIVE_HERO_HEADLINE.description}</p>
              <StorefrontHeroActionsV2 experience={storefrontExperience} onVisitorStart={startLogin} />
              <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold tracking-[0.04em] text-[#211c14]/55">
                <span className="inline-flex items-center gap-1.5"><Eye size={13} className="v2-accent" /> อ่านตัวอย่างฟรีก่อนตัดสินใจ</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="v2-accent" /> ชำระผ่าน Stripe</span>
                <span className="inline-flex items-center gap-1.5"><InfinityIcon size={13} className="v2-accent" /> กลับมาอ่านได้ตลอด</span>
              </p>
            </div>
            <figure className="reveal reveal-delay-2">
              <div className="v2-frame overflow-hidden bg-[#211c14]">
                <img src={HOME_HERO_IMAGE} alt="กระดานหมาก — อ่านเกมก่อนวางหมากแรก" className="aspect-[4/3.3] w-full object-cover" />
              </div>
              <figcaption className="v2-kicker mt-5 flex items-center justify-center gap-3 text-[10px] text-[#211c14]/55">
                <span aria-hidden="true" className="h-px w-8 bg-[#211c14]/30" />
                อ่านเกมก่อนวางหมากแรก
                <span aria-hidden="true" className="h-px w-8 bg-[#211c14]/30" />
              </figcaption>
            </figure>
          </div>
        </section>

        {/* TRUST STRIP — quiet facts, no cards */}
        <section aria-label="จุดเชื่อมั่นก่อนเริ่ม" className="border-y border-[#211c14]/15 bg-[#efe8d7]">
          <div className="container grid sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Library, label: `${products.length || "—"} บันไดให้เลือก` },
              { icon: Eye, label: "ทุกรายการมีตัวอย่างให้อ่าน" },
              { icon: ShieldCheck, label: "ราคาถูกตรวจบนเซิร์ฟเวอร์" },
              { icon: InfinityIcon, label: "สิทธิ์ผูกกับบัญชีของคุณ" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center justify-center gap-2.5 py-4">
                <Icon size={14} className="v2-accent" />
                <span className="text-[11px] font-bold tracking-[0.06em] text-[#211c14]/70">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CATALOG — print-catalog cards with hard offset shadows */}
        <section id="editions" className="container scroll-mt-20 py-16 sm:py-24">
          <div className="reveal flex flex-col justify-between gap-5 border-b border-[#211c14]/20 pb-8 md:flex-row md:items-end">
            <div>
              <div className="v2-kicker v2-accent">ความสำเร็จไม่ได้เริ่มจากทำทุกอย่าง</div>
              <h2 className="v2-serif mt-4 text-4xl leading-[1.08] sm:text-5xl">เริ่มเปลี่ยน<br />ก้าวถัดไปของคุณ</h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-[#211c14]/60">เลือกหนึ่งทักษะที่ถ้าเก่งขึ้นแล้วชีวิตจะขยับ อ่านหรือเรียนเป็นช่วง ๆ แล้วนำไปใช้กับงานและชีวิตของคุณทันที</p>
          </div>
          {catalog.isLoading ? (
            <div className="grid min-h-80 place-items-center text-sm text-[#211c14]/50">กำลังจัดบันไดขั้นแรกให้คุณ…</div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {products.map((product, index) => (
                <article key={product.slug} id={`product-${product.slug}`} className="v2-card reveal group flex scroll-mt-28 flex-col" style={{ transitionDelay: `${Math.min(index * 60, 180)}ms` }}>
                  <div className="relative overflow-hidden border-b border-[#211c14]/20 bg-[#211c14]">
                    <img src={product.coverUrl} alt={`หน้าปก ${product.title}`} className="aspect-[3/3.8] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                    <span className="absolute left-3 top-3 bg-[#211c14] px-2.5 py-1.5 text-[9px] font-bold tracking-[0.12em] text-[#f5efe3]">{formatProductType(product.productType)}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="v2-kicker text-[10px] text-[#211c14]/50">{String(index + 1).padStart(2, "0")} — {product.category}</div>
                    <h3 className="v2-serif mt-2.5 text-[1.55rem] leading-snug">{product.title}</h3>
                    <p className="mt-2.5 text-[13px] leading-6 text-[#211c14]/65">{product.description}</p>
                    <div className="mt-4 text-[10px] font-bold tracking-[0.08em] text-[#211c14]/55">
                      {product.productType === "bundle" ? <>ปลดล็อก {product.includedProductIds.length} สินค้า · {product.durationLabel}</> : <>{product.unitCount} {product.productType === "course" ? "บทเรียน" : "บท"} · {product.durationLabel}</>}
                    </div>
                    <div className="mt-auto pt-5">
                      <div className="flex items-baseline justify-between border-t border-[#211c14]/15 pt-4">
                        <span className="v2-serif text-[1.35rem]">{formatCurrency(product.priceSatang)}</span>
                        <span className="text-[10px] font-semibold text-[#211c14]/45">ชำระครั้งเดียว</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => addToCart(product.slug)} className="v2-btn v2-btn-ghost px-3 py-3 text-[10px]">เก็บไว้ก่อน</button>
                        <button type="button" onClick={() => startCheckout([{ productId: product.slug, quantity: 1 }])} className="v2-btn v2-btn-accent px-3 py-3 text-[10px]">ซื้อเลย</button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* OWNERSHIP — numbered editorial rows, no boxes */}
        <section id="membership" className="border-y border-[#211c14]/15 bg-[#ece3cf] py-16 sm:py-24">
          <div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="reveal">
              <div className="v2-kicker v2-accent">ซื้อแล้วมีที่ให้กลับมาใช้</div>
              <h2 className="v2-serif mt-4 text-4xl leading-[1.08] sm:text-5xl">ไม่ใช่แค่ได้อ่าน<br /><span className="text-[#211c14]/50">แต่ได้ที่เก็บคำตอบของคุณ</span></h2>
            </div>
            <ol className="reveal">
              {OWNERSHIP_STEPS.map((step) => (
                <li key={step.number} className="flex gap-6 border-t border-[#211c14]/15 py-6 first:border-t-0 first:pt-0 sm:gap-8">
                  <span className="v2-serif v2-accent shrink-0 text-3xl leading-none">{step.number}</span>
                  <div>
                    <h3 className="text-base font-bold">{step.title}</h3>
                    <p className="mt-2 text-[13px] leading-7 text-[#211c14]/62">{step.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* SOCIAL PROOF — honest by design: real consented feedback or a transparent disclosure */}
        <section aria-labelledby="learner-proof-title" className="py-16 sm:py-24">
          <div className="container">
            <div className="reveal grid gap-8 border-b border-[#211c14]/20 pb-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <div className="v2-kicker v2-accent">{SOCIAL_PROOF.eyebrow}</div>
                <h2 id="learner-proof-title" className="v2-serif mt-4 text-4xl leading-[1.06] sm:text-6xl">{SOCIAL_PROOF.title}<br /><span className="text-[#211c14]/50">{SOCIAL_PROOF.highlight}</span></h2>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 border border-[#c8431d]/40 bg-[#c8431d]/[0.07] px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] text-[#c8431d]">
                  <BadgeCheck size={13} /> {learnerProof.length ? "เสียงสะท้อนที่ยืนยันแล้ว" : SOCIAL_PROOF.status}
                </div>
                <p className="mt-4 max-w-md text-sm leading-7 text-[#211c14]/60">{learnerProof.length ? "แสดงเฉพาะเสียงสะท้อนที่มาจากผู้ซื้อจริง ยินยอมให้เผยแพร่ และผ่านการอนุมัติจากทีม Brightline แล้ว" : SOCIAL_PROOF.description}</p>
              </div>
            </div>
            {learnerProof.length ? (
              <div className="mt-10 grid gap-5 md:grid-cols-3">
                {learnerProof.map((testimonial, index) => (
                  <figure key={testimonial.id} className={`reveal flex min-h-60 flex-col border border-[#211c14]/20 bg-[#fdfaf3] p-6 reveal-delay-${Math.min(index + 1, 3)}`}>
                    <blockquote className="v2-serif text-[15px] leading-8 text-[#211c14]/85">“{testimonial.feedback}”</blockquote>
                    <figcaption className="mt-auto border-t border-[#211c14]/15 pt-4">
                      <div className="text-xs font-bold">{testimonial.displayName}</div>
                      <div className="mt-1 text-[10px] text-[#211c14]/50">ผู้เรียน {testimonial.productTitle}</div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <>
                <div className="mt-10 grid gap-x-10 md:grid-cols-3">
                  {SOCIAL_PROOF.workflow.map((step, index) => (
                    <article key={step.number} className={`reveal border-t-2 border-[#211c14] pt-5 reveal-delay-${index + 1}`}>
                      <div className="v2-accent font-mono text-xs">{step.number}</div>
                      <h3 className="mt-4 text-base font-bold">{step.title}</h3>
                      <p className="mt-2.5 text-[13px] leading-6 text-[#211c14]/60">{step.copy}</p>
                    </article>
                  ))}
                </div>
                <div className="reveal mt-8 flex flex-col gap-4 border border-dashed border-[#c8431d]/45 bg-[#c8431d]/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-3xl text-xs leading-5 text-[#211c14]/60">{SOCIAL_PROOF.disclosure}</p>
                  <a href="#editions" className="v2-link-underline v2-accent inline-flex shrink-0 items-center gap-2 self-start text-[10px] font-bold tracking-[0.08em] sm:self-auto">
                    เริ่มสร้างผลลัพธ์ของคุณ <ArrowDownRight size={14} />
                  </a>
                </div>
              </>
            )}
          </div>
        </section>

        {/* FINAL CTA — goal-gradient close: small first step, big clarity */}
        <section className="bg-[#c8431d] text-[#fdf6ea]">
          <div className="container flex flex-col items-start gap-9 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
            <div className="reveal">
              <h2 className="v2-serif text-4xl leading-[1.06] sm:text-5xl">ก้าวแรกไม่ต้องใหญ่<br />แค่ต้องชัด</h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-[#fdf6ea]/85">เลือกเรื่องที่ใช่หนึ่งเรื่อง อ่านตัวอย่างฟรี แล้วตัดสินใจจากสิ่งที่ได้อ่านจริง — ไม่ต้องรีบ แต่อย่ายืนนอกกระดาน</p>
            </div>
            <a href="#editions" className="v2-btn group shrink-0 bg-[#211c14] px-8 py-4 text-[11px] text-[#f5efe3] transition-colors hover:bg-[#3a3125]">
              เลือกหมากแรกของคุณ <ArrowDown size={15} className="transition-transform group-hover:translate-y-0.5" />
            </a>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#211c14]/15 py-9 pb-[max(2.25rem,env(safe-area-inset-bottom))]">
        <div className="container flex flex-col items-center gap-3 text-center text-[10px] font-bold tracking-[0.14em] text-[#211c14]/45 sm:flex-row sm:justify-between sm:text-left">
          <span>BRIGHTLINE © 2026</span>
          <span>DIGITAL LEARNING FOR THAI CREATORS</span>
          <span>สร้างมาเพื่อเรียนรู้</span>
        </div>
      </footer>
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="ตะกร้าสินค้า">
          <button type="button" onClick={() => setCartOpen(false)} className="absolute inset-0 bg-[#211c14]/55" aria-label="ปิดตะกร้า" />
          <aside className="relative flex h-full w-full max-w-md flex-col border-l border-[#211c14]/25 bg-[#fdfaf3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#211c14]/15 px-6 py-5">
              <h2 className="v2-serif flex items-center gap-3 text-2xl">
                <ShoppingBag size={18} className="v2-accent" />
                ตะกร้าของคุณ
                <span className="font-mono text-xs text-[#211c14]/45">({itemCount})</span>
              </h2>
              <button type="button" onClick={() => setCartOpen(false)} aria-label="ปิดตะกร้า" className="grid h-9 w-9 place-items-center rounded-[3px] border border-[#211c14]/25 text-[#211c14]/70 transition-colors hover:border-[#211c14] hover:text-[#211c14]">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {items.length === 0 ? (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <Sparkles className="v2-accent mx-auto mb-4" size={24} />
                    <h3 className="v2-serif text-3xl">ตะกร้ายังว่างอยู่</h3>
                    <p className="mt-3 max-w-xs text-sm leading-7 text-[#211c14]/60">เลือกหนังสือหรือคอร์สที่อยากเริ่มก่อน — อ่านตัวอย่างได้ฟรีทุกรายการ</p>
                    <button type="button" onClick={() => setCartOpen(false)} className="v2-btn v2-btn-ink mt-6 px-5 py-3 text-[10px]">เลือกดูสินค้า</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {items.map(({ product, quantity }) => (
                    <div key={product.slug} className="flex gap-4 border-b border-[#211c14]/12 pb-5">
                      <img src={product.coverUrl} alt="" className="h-28 w-[74px] rounded-[3px] border border-[#211c14]/20 object-cover" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="v2-kicker text-[9px] text-[#211c14]/50">{formatProductType(product.productType)}</div>
                            <h3 className="v2-serif mt-1 text-xl leading-snug">{product.title}</h3>
                          </div>
                          <button type="button" onClick={() => removeItem(product.slug)} className="text-[10px] font-bold tracking-wide text-[#211c14]/45 underline-offset-4 transition-colors hover:text-[#c8431d] hover:underline">เอาออก</button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex items-center rounded-[3px] border border-[#211c14]/25">
                            <button type="button" aria-label="ลดจำนวน" onClick={() => setQuantity(product.slug, quantity - 1)} className="grid h-8 w-8 place-items-center text-[#211c14]/70 transition-colors hover:text-[#c8431d]"><Minus size={13} /></button>
                            <span className="w-7 text-center font-mono text-xs">{quantity}</span>
                            <button type="button" aria-label="เพิ่มจำนวน" onClick={() => setQuantity(product.slug, quantity + 1)} className="grid h-8 w-8 place-items-center text-[#211c14]/70 transition-colors hover:text-[#c8431d]"><Plus size={13} /></button>
                          </div>
                          <span className="font-mono text-sm">{formatCurrency(product.priceSatang * quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t border-[#211c14]/15 px-6 py-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-[0.1em] text-[#211c14]/55">ยอดรวม</span>
                  <span className="v2-serif text-2xl">{formatCurrency(subtotal)}</span>
                </div>
                <p className="mt-2 text-[10px] leading-5 text-[#211c14]/50">ราคาและสิทธิ์จะถูกตรวจอีกครั้งบนเซิร์ฟเวอร์ก่อนเปิดหน้าชำระเงิน</p>
                <button type="button" onClick={() => startCheckout()} disabled={checkout.isPending} className="v2-btn v2-btn-accent mt-4 w-full px-5 py-4 text-[11px] disabled:opacity-60">
                  {checkout.isPending ? "กำลังเปิดหน้าชำระเงิน…" : "ชำระเงินด้วย Stripe"} <ArrowDownRight size={14} />
                </button>
                <button type="button" onClick={clearCart} className="mt-3 w-full text-[10px] font-bold tracking-[0.08em] text-[#211c14]/45 underline-offset-4 transition-colors hover:text-[#c8431d] hover:underline">ล้างตะกร้า</button>
              </div>
            )}
          </aside>
        </div>
      )}
      <CheckoutOfferDialog intent={checkoutIntent} offers={checkoutOffers.data} isLoading={checkoutOffers.isLoading} isSubmitting={checkout.isPending} onCancel={() => setCheckoutIntent(null)} onCheckout={(offerId) => checkoutIntent && checkout.mutate({ items: checkoutIntent.items, offerId })} />
    </div>
  );
}
