import { useAuth } from "@/_core/hooks/useAuth";
import { StoreHeader } from "@/components/StoreHeader";
import { CheckoutOfferDialog } from "@/components/CheckoutOfferDialog";
import { getStorefrontExperience } from "@/components/storefrontAccess";
import { StorefrontHeroActions } from "@/components/StorefrontHeroActions";
import { startLogin } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency, formatProductType } from "@/data/catalog";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { trpc } from "@/lib/trpc";
import { ACTIVE_HERO_HEADLINE, HOME_HERO_IMAGE, SOCIAL_PROOF } from "@/pages/homeContent";
import { ArrowDownRight, ArrowUpRight, BadgeCheck, Check, MessageSquareQuote, Minus, Plus, ShieldCheck, ShoppingBag, Sparkles, X, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

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

  return <div className="min-h-screen overflow-hidden bg-[#0a0b0d] text-white">
    <StoreHeader onOpenCart={() => setCartOpen(true)} />
    <main>
      <section className="relative isolate min-h-[720px] overflow-hidden lg:min-h-[780px]">
        <div aria-hidden="true" className="absolute inset-0 bg-cover bg-[position:68%_center] opacity-95 sm:bg-[position:70%_center]" style={{ backgroundImage: `url('${HOME_HERO_IMAGE}')` }} />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,#090b0b_0%,rgba(9,11,11,.98)_24%,rgba(9,14,13,.80)_51%,rgba(9,14,13,.31)_74%,rgba(4,6,6,.56)_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,7,7,.72)_0%,transparent_44%,rgba(5,7,7,.24)_100%)]" />
        <div className="container relative z-10 flex min-h-[720px] items-center py-20 lg:min-h-[780px] lg:py-24">
          <div className="reveal max-w-3xl">
            <div className="mb-7 flex items-center gap-3"><span className="h-px w-9 bg-[#d5ff45]" /><span className="eyebrow text-[#d5ff45]">{ACTIVE_HERO_HEADLINE.eyebrow}</span></div>
            <h1 className="font-display max-w-3xl text-[clamp(3.45rem,7.6vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.065em] text-white">{ACTIVE_HERO_HEADLINE.lead}<br /><em className="text-[#d5ff45]">{ACTIVE_HERO_HEADLINE.highlight}</em></h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-white/72 sm:text-lg">{ACTIVE_HERO_HEADLINE.description}</p>
            <StorefrontHeroActions experience={storefrontExperience} onVisitorStart={startLogin} />
            <div className="mt-16 grid max-w-md grid-cols-3 border-t border-white/15 pt-5 text-white/64"><div><div className="font-display text-2xl text-white">{products.length || "—"}</div><div className="mt-1 text-[9px] font-semibold tracking-[0.12em]">บันไดให้เลือก</div></div><div><div className="font-display text-2xl text-white">eBook +</div><div className="mt-1 text-[9px] font-semibold tracking-[0.12em]">คอร์สใช้จริง</div></div><div><div className="font-display text-2xl text-white">∞</div><div className="mt-1 text-[9px] font-semibold tracking-[0.12em]">กลับมาเรียนต่อ</div></div></div>
          </div>
        </div>
      </section>

      <section id="editions" className="container scroll-mt-20 py-16 sm:py-24"><div className="reveal flex flex-col justify-between gap-5 border-b border-white/12 pb-7 md:flex-row md:items-end"><div><div className="eyebrow text-[#d5ff45]">ความสำเร็จไม่ได้เริ่มจากทำทุกอย่าง</div><h2 className="font-display mt-3 text-4xl tracking-[-0.045em] sm:text-5xl">เริ่มเปลี่ยน<br />ก้าวถัดไปของคุณ</h2></div><p className="max-w-sm text-sm leading-6 text-white/55">เลือกหนึ่งทักษะที่ถ้าเก่งขึ้นแล้วชีวิตจะขยับ อ่านหรือเรียนเป็นช่วง ๆ แล้วนำไปใช้กับงานและชีวิตของคุณทันที</p></div>{catalog.isLoading ? <div className="grid min-h-80 place-items-center text-sm text-white/45">กำลังจัดบันไดขั้นแรกให้คุณ…</div> : <div className="mt-9 grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-4">{products.map((product, index) => <article id={`product-${product.slug}`} key={product.slug} className="reveal group scroll-mt-24" style={{ transitionDelay: `${Math.min(index * 60, 180)}ms` }}><div className="relative overflow-hidden rounded-2xl bg-[#161819]"><img src={product.coverUrl} alt={`หน้าปก ${product.title}`} className="aspect-[3/3.8] w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" /><div className="absolute inset-0 bg-gradient-to-t from-black/78 via-transparent to-transparent opacity-70" /><span className="absolute left-4 top-4 rounded-full border border-white/18 bg-black/20 px-3 py-1.5 text-[9px] font-semibold tracking-[0.1em] text-white/85 backdrop-blur-sm">{formatProductType(product.productType)}</span></div><div className="mt-5 flex items-start justify-between gap-5"><div><div className="eyebrow mb-2">{String(index + 1).padStart(2, "0")} / {product.category}</div><h3 className="font-display text-3xl tracking-[-0.045em] text-white">{product.title}</h3></div><span className="pt-1 font-mono text-xs text-[#d5ff45]">{formatCurrency(product.priceSatang)}</span></div><p className="mt-3 text-sm leading-6 text-white/55">{product.description}</p><div className="mt-5 text-[10px] font-bold tracking-[0.1em] text-white/52">{product.productType === "bundle" ? <>ปลดล็อก {product.includedProductIds.length} สินค้า · {product.durationLabel}</> : <>{product.unitCount} {product.productType === "course" ? "บทเรียน" : "บท"} · {product.durationLabel}</>}</div><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => addToCart(product.slug)} className="rounded-xl border border-white/16 px-3 py-3 text-[10px] font-extrabold tracking-[0.08em] text-white transition hover:border-white/45 hover:bg-white/7">เก็บไว้ก่อน</button><button type="button" onClick={() => startCheckout([{ productId: product.slug, quantity: 1 }])} className="gradient-cta rounded-xl px-3 py-3 text-[10px] font-extrabold tracking-[0.08em] text-black shadow-lg">เริ่มก้าวแรก</button></div></article>)}</div>}</section>

      <section aria-labelledby="learner-proof-title" className="relative overflow-hidden border-y border-white/10 bg-[#0d100f] py-16 sm:py-24"><div aria-hidden="true" className="absolute left-[6%] top-10 h-72 w-72 rounded-full bg-lime-300/[0.055] blur-[100px]" /><div aria-hidden="true" className="absolute right-[8%] bottom-0 h-56 w-56 rounded-full bg-emerald-400/[0.08] blur-[90px]" /><div className="container relative"><div className="reveal grid gap-8 border-b border-white/10 pb-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-end"><div><div className="eyebrow text-[#d5ff45]">{SOCIAL_PROOF.eyebrow}</div><h2 id="learner-proof-title" className="font-display mt-3 text-4xl leading-[0.96] tracking-[-0.052em] text-white sm:text-6xl">{SOCIAL_PROOF.title}<br /><em className="text-white/45">{SOCIAL_PROOF.highlight}</em></h2></div><div className="lg:pb-1"><div className="inline-flex items-center gap-2 rounded-full border border-[#d5ff45]/22 bg-[#d5ff45]/[0.06] px-3 py-1.5 text-[9px] font-bold tracking-[0.12em] text-[#d5ff45]"><BadgeCheck size={13} /> {learnerProof.length ? "เสียงสะท้อนที่ยืนยันแล้ว" : SOCIAL_PROOF.status}</div><p className="mt-4 max-w-md text-sm leading-6 text-white/56">{learnerProof.length ? "แสดงเฉพาะเสียงสะท้อนที่มาจากผู้ซื้อจริง ยินยอมให้เผยแพร่ และผ่านการอนุมัติจากทีม Brightline แล้ว" : SOCIAL_PROOF.description}</p></div></div>{learnerProof.length ? <><div className="mt-8 grid gap-3 md:grid-cols-3">{learnerProof.map((testimonial, index) => <figure key={testimonial.id} className={`reveal flex min-h-64 flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-6 reveal-delay-${Math.min(index + 1, 3)}`}><MessageSquareQuote size={19} className="text-[#d5ff45]" /><blockquote className="mt-8 text-sm leading-7 text-white/80">“{testimonial.feedback}”</blockquote><figcaption className="mt-auto border-t border-white/10 pt-4"><div className="text-xs font-bold text-white">{testimonial.displayName}</div><div className="mt-1 text-[10px] text-white/45">ผู้เรียน {testimonial.productTitle}</div></figcaption></figure>)}</div><p className="reveal mt-5 text-center text-[10px] leading-5 text-white/42">ทุกเสียงสะท้อนมาจากผู้ซื้อจริงที่ยินยอมให้เผยแพร่ และอาจถูกซ่อนเมื่อคำยินยอมหรือสถานะการอนุมัติเปลี่ยนแปลง</p></> : <><div className="mt-8 grid gap-3 md:grid-cols-3">{SOCIAL_PROOF.workflow.map((step, index) => <article key={step.number} className={`reveal rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition-colors hover:border-[#d5ff45]/25 reveal-delay-${index + 1}`}><div className="flex items-center justify-between"><span className="font-mono text-xs text-[#d5ff45]">{step.number}</span>{index === 0 ? <MessageSquareQuote size={18} className="text-white/30" /> : index === 1 ? <Check size={18} className="text-white/30" /> : <ShieldCheck size={18} className="text-white/30" />}</div><h3 className="mt-12 text-base font-bold tracking-tight text-white">{step.title}</h3><p className="mt-3 text-xs leading-5 text-white/52">{step.copy}</p></article>)}</div><div className="reveal mt-5 flex flex-col gap-4 rounded-2xl border border-dashed border-white/18 bg-black/20 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-3xl text-xs leading-5 text-white/52">{SOCIAL_PROOF.disclosure}</p><a href="#editions" className="inline-flex shrink-0 items-center gap-2 self-start text-[10px] font-bold tracking-[0.1em] text-[#d5ff45] transition-colors hover:text-[#eeff9b] sm:self-auto">เริ่มสร้างผลลัพธ์ของคุณ <ArrowDownRight size={14} /></a></div></>}</div></section>

      <section id="membership" className="relative mt-4 overflow-hidden border-y border-white/10 bg-[#121413] py-16 pb-20 sm:py-24"><div className="absolute right-[9%] top-0 h-64 w-64 rounded-full bg-emerald-400/12 blur-[100px]" /><div className="container relative grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div className="reveal"><div className="eyebrow text-[#d5ff45]">ซื้อแล้วมีที่ให้กลับมาใช้</div><h2 className="font-display mt-4 text-5xl leading-[0.96] tracking-[-0.06em] sm:text-6xl">ไม่ใช่แค่ได้อ่าน<br /><em className="text-white/45">แต่ได้ที่เก็บคำตอบของคุณ</em></h2></div><div className="grid gap-4 sm:grid-cols-3">{[["01", "เลือกจากปัญหาจริง", "เริ่มที่เรื่องเดียวที่คุณอยากทำให้ชัดขึ้น ไม่ต้องซื้อทั้งชั้น"], ["02", "ชำระอย่างมั่นใจ", "เข้าสู่ระบบก่อนชำระ สิทธิ์จะผูกกับบัญชีของคุณโดยตรง"], ["03", "กลับมาใช้ตอนจำเป็น", "เปิด eBook หรือเรียนคอร์สต่อใน Dashboard ของคุณได้ทุกเมื่อ"]].map(([number, title, copy], index) => <div key={number} className={`reveal rounded-2xl border border-white/10 bg-white/[0.025] p-5 reveal-delay-${index + 1}`}><div className="font-mono text-xs text-[#d5ff45]">{number}</div><h3 className="mt-8 text-sm font-bold tracking-tight text-white">{title}</h3><p className="mt-3 text-xs leading-5 text-white/52">{copy}</p></div>)}</div></div></section>
    </main>
    <footer className="border-t border-white/10 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-7"><div className="container flex flex-col items-center gap-3 text-center text-[10px] font-semibold tracking-[0.13em] text-white/40 sm:flex-row sm:justify-between sm:text-left"><span>BRIGHTLINE © 2026</span><span>DIGITAL LEARNING FOR THAI CREATORS</span><span>สร้างมาเพื่อเรียนรู้</span></div></footer>
    {cartOpen && <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="ตะกร้าสินค้า"><button type="button" onClick={() => setCartOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="ปิดตะกร้า" /><aside className="relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#101211] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 px-6 py-5"><div className="flex items-center gap-3"><ShoppingBag size={18} className="text-[#d5ff45]" /><h2 className="font-display text-2xl tracking-[-0.04em]">ตะกร้าของคุณ <span className="font-mono text-xs text-white/40">({itemCount})</span></h2></div><button type="button" onClick={() => setCartOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/70 transition-colors hover:text-white"><X size={17} /></button></div><div className="flex-1 overflow-y-auto px-6 py-5">{items.length === 0 ? <div className="grid h-full place-items-center text-center"><div><Sparkles className="mx-auto mb-4 text-[#d5ff45]" size={24} /><h3 className="font-display text-3xl">ตะกร้ายังว่างอยู่</h3><p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/52">เลือกหนังสือหรือคอร์สที่อยากเริ่มก่อน</p><button type="button" onClick={() => setCartOpen(false)} className="mt-6 text-[10px] font-bold tracking-[0.14em] text-[#d5ff45]">เลือกดูสินค้า</button></div></div> : <div className="space-y-5">{items.map(({ product, quantity }) => <div key={product.slug} className="flex gap-4"><img src={product.coverUrl} alt="" className="h-28 w-[74px] rounded-lg object-cover" /><div className="flex min-w-0 flex-1 flex-col"><div className="flex items-start justify-between gap-3"><div><div className="eyebrow text-[8px]">{formatProductType(product.productType)}</div><h3 className="font-display mt-1 text-xl tracking-[-0.04em]">{product.title}</h3></div><button type="button" onClick={() => removeItem(product.slug)} className="text-[10px] font-bold tracking-[0.1em] text-white/38 transition-colors hover:text-white">ลบ</button></div><div className="mt-auto flex items-center justify-between"><div className="flex items-center rounded-full border border-white/12"><button type="button" onClick={() => setQuantity(product.slug, quantity - 1)} className="grid h-7 w-7 place-items-center text-white/62 hover:text-white"><Minus size={12} /></button><span className="w-5 text-center font-mono text-[11px]">{quantity}</span><button type="button" onClick={() => setQuantity(product.slug, quantity + 1)} className="grid h-7 w-7 place-items-center text-white/62 hover:text-white"><Plus size={12} /></button></div><span className="font-mono text-xs text-[#d5ff45]">{formatCurrency(product.priceSatang * quantity)}</span></div></div></div>)}</div>}</div>{items.length > 0 && <div className="border-t border-white/10 px-6 py-5"><div className="mb-5 flex items-center justify-between text-sm text-white/64"><span>รวมทั้งหมด</span><span className="font-mono text-base text-white">{formatCurrency(subtotal)}</span></div><button type="button" disabled={checkout.isPending} onClick={() => startCheckout()} className="gradient-cta flex w-full items-center justify-center gap-3 rounded-full px-5 py-3.5 text-[11px] font-extrabold tracking-[0.13em] text-white shadow-lg disabled:cursor-wait disabled:opacity-70">{checkout.isPending ? "กำลังเปิดหน้าชำระเงิน…" : "ดูข้อเสนอและชำระเงิน"} <ArrowUpRight size={15} /></button><p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] leading-4 text-white/42"><Check size={12} className="text-[#d5ff45]" /> ข้อเสนอและราคารวมจะตรวจบนเซิร์ฟเวอร์</p></div>}</aside></div>}
    <CheckoutOfferDialog intent={checkoutIntent} offers={checkoutOffers.data} isLoading={checkoutOffers.isLoading} isSubmitting={checkout.isPending} onCancel={() => setCheckoutIntent(null)} onCheckout={(offerId) => checkoutIntent && checkout.mutate({ items: checkoutIntent.items, offerId })} />
  </div>;
}
