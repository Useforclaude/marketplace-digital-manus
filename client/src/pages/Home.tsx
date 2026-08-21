import { useAuth } from "@/_core/hooks/useAuth";
import { StoreHeader } from "@/components/StoreHeader";
import { startLogin } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency, formatProductType } from "@/data/catalog";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { trpc } from "@/lib/trpc";
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, Minus, Plus, ShoppingBag, Sparkles, X, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const catalog = trpc.catalog.list.useQuery();
  const { addItem, itemCount, items, removeItem, setQuantity, subtotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const checkout = trpc.commerce.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank", "noopener,noreferrer");
      clearCart();
      toast.success("กำลังเปิดหน้าชำระเงิน", { description: "ชำระผ่าน Stripe ในแท็บใหม่ แล้วสินค้าจะเข้าคลังของคุณทันที" });
    },
    onError: (error) => toast.error("ยังเริ่มชำระเงินไม่ได้", { description: error.message || "กรุณาลองใหม่อีกครั้ง" }),
  });

  const products = catalog.data ?? [];
  useScrollReveal(products.length);
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
    checkout.mutate({ items: checkoutItems });
  };

  return <div className="min-h-screen overflow-hidden bg-[#0a0b0d] text-white">
    <StoreHeader onOpenCart={() => setCartOpen(true)} />
    <main>
      <section className="relative isolate min-h-[720px] overflow-hidden lg:min-h-[780px]">
        <div aria-hidden="true" className="absolute inset-0 bg-cover bg-[position:70%_center] opacity-95" style={{ backgroundImage: "url('/manus-storage/brightline-success-path-hero_2bafa954.jpg')" }} />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,#090b0b_0%,rgba(9,11,11,.96)_23%,rgba(9,14,13,.76)_49%,rgba(9,14,13,.28)_73%,rgba(4,6,6,.5)_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,7,7,.72)_0%,transparent_44%,rgba(5,7,7,.24)_100%)]" />
        <div className="container relative z-10 flex min-h-[720px] items-center py-20 lg:min-h-[780px] lg:py-24">
          <div className="reveal max-w-3xl">
            <div className="mb-7 flex items-center gap-3"><span className="h-px w-9 bg-[#d5ff45]" /><span className="eyebrow text-[#d5ff45]">ถ้าคุณรู้ว่าตัวเองไปได้ไกลกว่านี้</span></div>
            <h1 className="font-display max-w-3xl text-[clamp(3.45rem,7.6vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.065em] text-white">อย่าปล่อยให้<br /><em className="text-[#d5ff45]">ความตั้งใจไม่มีทางไป</em></h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-white/72 sm:text-lg">คุณไม่จำเป็นต้องรู้ทุกอย่างเพื่อเริ่มสำเร็จ แค่ต้องมีเรื่องที่ใช่ในเวลาที่ใช่ Brightline คือ eBook และคอร์สที่ช่วยคุณเปลี่ยนความอยากไปไกล ให้เป็นทักษะ การตัดสินใจ และก้าวที่ทำได้จริง</p>
            <div className="mt-10 flex flex-wrap items-center gap-3"><a href="#editions" className="gradient-cta group inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-[11px] font-extrabold tracking-[0.12em] text-black">หาบันไดขั้นแรกของคุณ <ArrowDownRight size={15} className="transition-transform group-hover:translate-y-0.5 group-hover:translate-x-0.5" /></a><a href="#membership" className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-black/20 px-5 py-3.5 text-[11px] font-bold tracking-[0.1em] text-white/88 backdrop-blur-sm transition-colors hover:border-white/40 hover:text-white">ดูเส้นทางที่คุณจะได้ <ChevronRight size={14} /></a></div>
            <div className="mt-16 grid max-w-md grid-cols-3 border-t border-white/15 pt-5 text-white/64"><div><div className="font-display text-2xl text-white">{products.length || "—"}</div><div className="mt-1 text-[9px] font-semibold tracking-[0.12em]">บันไดให้เลือก</div></div><div><div className="font-display text-2xl text-white">eBook +</div><div className="mt-1 text-[9px] font-semibold tracking-[0.12em]">คอร์สใช้จริง</div></div><div><div className="font-display text-2xl text-white">∞</div><div className="mt-1 text-[9px] font-semibold tracking-[0.12em]">กลับมาเรียนต่อ</div></div></div>
          </div>
        </div>
      </section>

      <section id="editions" className="container scroll-mt-20 py-16 sm:py-24"><div className="reveal flex flex-col justify-between gap-5 border-b border-white/12 pb-7 md:flex-row md:items-end"><div><div className="eyebrow text-[#d5ff45]">ความสำเร็จไม่ได้เริ่มจากทำทุกอย่าง</div><h2 className="font-display mt-3 text-4xl tracking-[-0.045em] sm:text-5xl">เริ่มเปลี่ยน<br />ก้าวถัดไปของคุณ</h2></div><p className="max-w-sm text-sm leading-6 text-white/55">เลือกหนึ่งทักษะที่ถ้าเก่งขึ้นแล้วชีวิตจะขยับ อ่านหรือเรียนเป็นช่วง ๆ แล้วนำไปใช้กับงานและชีวิตของคุณทันที</p></div>{catalog.isLoading ? <div className="grid min-h-80 place-items-center text-sm text-white/45">กำลังจัดบันไดขั้นแรกให้คุณ…</div> : <div className="mt-9 grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-4">{products.map((product, index) => <article key={product.slug} className="reveal group" style={{ transitionDelay: `${Math.min(index * 60, 180)}ms` }}><div className="relative overflow-hidden rounded-2xl bg-[#161819]"><img src={product.coverUrl} alt={`หน้าปก ${product.title}`} className="aspect-[3/3.8] w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" /><div className="absolute inset-0 bg-gradient-to-t from-black/78 via-transparent to-transparent opacity-70" /><span className="absolute left-4 top-4 rounded-full border border-white/18 bg-black/20 px-3 py-1.5 text-[9px] font-semibold tracking-[0.1em] text-white/85 backdrop-blur-sm">{formatProductType(product.productType)}</span></div><div className="mt-5 flex items-start justify-between gap-5"><div><div className="eyebrow mb-2">{String(index + 1).padStart(2, "0")} / {product.category}</div><h3 className="font-display text-3xl tracking-[-0.045em] text-white">{product.title}</h3></div><span className="pt-1 font-mono text-xs text-[#d5ff45]">{formatCurrency(product.priceSatang)}</span></div><p className="mt-3 text-sm leading-6 text-white/55">{product.description}</p><div className="mt-5 text-[10px] font-bold tracking-[0.1em] text-white/52">{product.unitCount} {product.productType === "course" ? "บทเรียน" : "บท"} · {product.durationLabel}</div><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => addToCart(product.slug)} className="rounded-xl border border-white/16 px-3 py-3 text-[10px] font-extrabold tracking-[0.08em] text-white transition hover:border-white/45 hover:bg-white/7">เก็บไว้ก่อน</button><button type="button" onClick={() => startCheckout([{ productId: product.slug, quantity: 1 }])} className="gradient-cta rounded-xl px-3 py-3 text-[10px] font-extrabold tracking-[0.08em] text-black shadow-lg">เริ่มก้าวแรก</button></div></article>)}</div>}</section>

      <section id="membership" className="relative mt-4 overflow-hidden border-y border-white/10 bg-[#121413] py-16 sm:py-24"><div className="absolute right-[9%] top-0 h-64 w-64 rounded-full bg-emerald-400/12 blur-[100px]" /><div className="container relative grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div className="reveal"><div className="eyebrow text-[#d5ff45]">ซื้อแล้วมีที่ให้กลับมาใช้</div><h2 className="font-display mt-4 text-5xl leading-[0.96] tracking-[-0.06em] sm:text-6xl">ไม่ใช่แค่ได้อ่าน<br /><em className="text-white/45">แต่ได้ที่เก็บคำตอบของคุณ</em></h2></div><div className="grid gap-4 sm:grid-cols-3">{[["01", "เลือกจากปัญหาจริง", "เริ่มที่เรื่องเดียวที่คุณอยากทำให้ชัดขึ้น ไม่ต้องซื้อทั้งชั้น"], ["02", "ชำระอย่างมั่นใจ", "เข้าสู่ระบบก่อนชำระ สิทธิ์จะผูกกับบัญชีของคุณโดยตรง"], ["03", "กลับมาใช้ตอนจำเป็น", "เปิด eBook หรือเรียนคอร์สต่อใน Dashboard ของคุณได้ทุกเมื่อ"]].map(([number, title, copy], index) => <div key={number} className={`reveal rounded-2xl border border-white/10 bg-white/[0.025] p-5 reveal-delay-${index + 1}`}><div className="font-mono text-xs text-[#d5ff45]">{number}</div><h3 className="mt-8 text-sm font-bold tracking-tight text-white">{title}</h3><p className="mt-3 text-xs leading-5 text-white/52">{copy}</p></div>)}</div></div></section>
      <section className="container py-16 sm:py-24"><div className="reveal gradient-panel flex flex-col justify-between gap-8 rounded-[2rem] border border-[#d5ff45]/25 px-7 py-10 text-white sm:flex-row sm:items-end sm:px-10 sm:py-12"><div><div className="font-mono text-[10px] font-bold tracking-[0.16em] text-white/65">งานสำคัญไม่ควรต้องเริ่มจากศูนย์ทุกครั้ง</div><p className="font-display mt-3 max-w-2xl text-4xl leading-[0.98] tracking-[-0.055em] sm:text-5xl">เลือกหนึ่งปัญหาวันนี้<br />ให้กลายเป็นหนึ่งก้าวต่อไป</p></div><a href="#editions" className="inline-flex shrink-0 items-center gap-3 self-start rounded-full bg-[#e1ff58] px-5 py-3 text-[11px] font-bold tracking-[0.12em] text-[#09110b] transition-transform hover:-translate-y-0.5 active:scale-[0.97] sm:self-auto">ดูเรื่องที่ช่วยได้ <ArrowDownRight size={15} /></a></div></section>
    </main>
    <footer className="border-t border-white/10 py-7"><div className="container flex flex-col gap-3 text-[10px] font-semibold tracking-[0.13em] text-white/40 sm:flex-row sm:items-center sm:justify-between"><span>BRIGHTLINE © 2026</span><span>DIGITAL LEARNING FOR THAI CREATORS</span><span>สร้างมาเพื่อเรียนรู้</span></div></footer>
    {cartOpen && <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="ตะกร้าสินค้า"><button type="button" onClick={() => setCartOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="ปิดตะกร้า" /><aside className="relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#101211] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 px-6 py-5"><div className="flex items-center gap-3"><ShoppingBag size={18} className="text-[#d5ff45]" /><h2 className="font-display text-2xl tracking-[-0.04em]">ตะกร้าของคุณ <span className="font-mono text-xs text-white/40">({itemCount})</span></h2></div><button type="button" onClick={() => setCartOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/70 transition-colors hover:text-white"><X size={17} /></button></div><div className="flex-1 overflow-y-auto px-6 py-5">{items.length === 0 ? <div className="grid h-full place-items-center text-center"><div><Sparkles className="mx-auto mb-4 text-[#d5ff45]" size={24} /><h3 className="font-display text-3xl">ตะกร้ายังว่างอยู่</h3><p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/52">เลือกหนังสือหรือคอร์สที่อยากเริ่มก่อน</p><button type="button" onClick={() => setCartOpen(false)} className="mt-6 text-[10px] font-bold tracking-[0.14em] text-[#d5ff45]">เลือกดูสินค้า</button></div></div> : <div className="space-y-5">{items.map(({ product, quantity }) => <div key={product.slug} className="flex gap-4"><img src={product.coverUrl} alt="" className="h-28 w-[74px] rounded-lg object-cover" /><div className="flex min-w-0 flex-1 flex-col"><div className="flex items-start justify-between gap-3"><div><div className="eyebrow text-[8px]">{formatProductType(product.productType)}</div><h3 className="font-display mt-1 text-xl tracking-[-0.04em]">{product.title}</h3></div><button type="button" onClick={() => removeItem(product.slug)} className="text-[10px] font-bold tracking-[0.1em] text-white/38 transition-colors hover:text-white">ลบ</button></div><div className="mt-auto flex items-center justify-between"><div className="flex items-center rounded-full border border-white/12"><button type="button" onClick={() => setQuantity(product.slug, quantity - 1)} className="grid h-7 w-7 place-items-center text-white/62 hover:text-white"><Minus size={12} /></button><span className="w-5 text-center font-mono text-[11px]">{quantity}</span><button type="button" onClick={() => setQuantity(product.slug, quantity + 1)} className="grid h-7 w-7 place-items-center text-white/62 hover:text-white"><Plus size={12} /></button></div><span className="font-mono text-xs text-[#d5ff45]">{formatCurrency(product.priceSatang * quantity)}</span></div></div></div>)}</div>}</div>{items.length > 0 && <div className="border-t border-white/10 px-6 py-5"><div className="mb-5 flex items-center justify-between text-sm text-white/64"><span>รวมทั้งหมด</span><span className="font-mono text-base text-white">{formatCurrency(subtotal)}</span></div><button type="button" disabled={checkout.isPending} onClick={() => startCheckout()} className="gradient-cta flex w-full items-center justify-center gap-3 rounded-full px-5 py-3.5 text-[11px] font-extrabold tracking-[0.13em] text-white shadow-lg disabled:cursor-wait disabled:opacity-70">{checkout.isPending ? "กำลังเปิดหน้าชำระเงิน…" : "ไปชำระเงิน"} <ArrowUpRight size={15} /></button><p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] leading-4 text-white/42"><Check size={12} className="text-[#d5ff45]" /> ชำระเงินปลอดภัย · ปลดล็อกสิทธิ์ทันที</p></div>}</aside></div>}
  </div>;
}
