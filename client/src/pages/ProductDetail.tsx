import { useAuth } from "@/_core/hooks/useAuth";
import { CheckoutOfferDialog } from "@/components/CheckoutOfferDialog";
import { ProductShareActions } from "@/components/ProductShareActions";
import { StoreHeader } from "@/components/StoreHeader";
import { startLogin } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency, formatProductType } from "@/data/catalog";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, BookOpenText, Check, CirclePlay, PackageCheck, Quote, Sparkles } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { toast } from "sonner";

type PreviewContent = { intro: string; sections: { kicker: string; title: string; body: string[] }[] } | null;

export function ProductDetailLoading({ onOpenCart = () => {}, withHeader = true }: { onOpenCart?: () => void; withHeader?: boolean }) {
  return <div className="min-h-screen bg-[#0a0b0d] text-white">{withHeader && <StoreHeader onOpenCart={onOpenCart} />}<main className="container py-10 sm:py-16"><div className="detail-shimmer h-3 w-28 rounded-full" /><div className="mt-8 grid gap-9 lg:grid-cols-[0.75fr_1.25fr]"><div className="detail-shimmer aspect-[3/3.8] rounded-[2rem]" /><div className="space-y-5"><div className="detail-shimmer h-3 w-44 rounded-full" /><div className="detail-shimmer h-16 max-w-xl rounded-2xl" /><div className="detail-shimmer h-5 max-w-lg rounded-full" /><div className="detail-shimmer h-20 max-w-2xl rounded-2xl" /><div className="grid max-w-xl gap-3 sm:grid-cols-2"><div className="detail-shimmer h-13 rounded-xl" /><div className="detail-shimmer h-13 rounded-xl" /></div></div></div><div className="mt-12 flex items-center gap-3 text-[10px] font-bold tracking-[0.1em] text-white/45"><Sparkles size={14} className="animate-pulse text-[#d5ff45]" /> กำลังเรียงรายละเอียดให้อ่านง่าย…</div></main></div>;
}

export function ProductPreviewPresentation({ preview }: { preview: PreviewContent }) {
  if (!preview) return <div className="mt-7 rounded-2xl border border-dashed border-white/15 p-6 text-sm leading-7 text-white/55">ผู้ดูแลยังไม่ได้เปิดตัวอย่างสำหรับรายการนี้ แต่รายละเอียดและสิ่งที่จะได้รับแสดงไว้ครบถ้วนด้านบน</div>;
  return <div className="mt-7 space-y-6"><div className="preview-intro max-w-2xl"><Quote size={18} className="text-[#d5ff45]" /><p className="mt-4 text-base leading-8 text-white/78">{preview.intro}</p><div className="mt-5 h-px w-16 bg-[#d5ff45]/60" /></div>{preview.sections.map((section, index) => <article key={`${section.title}-${index}`} className="detail-preview-card" style={{ animationDelay: `${220 + index * 90}ms` }}><div className="flex items-start gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d5ff45]/25 bg-[#d5ff45]/10 font-mono text-xs text-[#d5ff45]">0{index + 1}</span><div className="min-w-0"><div className="eyebrow text-[#d5ff45]">{section.kicker || `ตัวอย่าง ${index + 1}`}</div><h3 className="font-display mt-3 text-3xl tracking-[-0.045em]">{section.title}</h3>{section.body.map((paragraph, bodyIndex) => <p key={bodyIndex} className="mt-4 text-sm leading-7 text-white/68">{paragraph}</p>)}</div></div></article>)}</div>;
}

export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug ?? "";
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const detail = trpc.catalog.detail.useQuery({ slug }, { enabled: Boolean(slug) });
  const [intent, setIntent] = useState<{ items: { productId: string; quantity: number }[]; sourceProductId: string } | null>(null);
  const offers = trpc.commerce.offers.useQuery({ sourceProductId: intent?.sourceProductId ?? "__none__" }, { enabled: Boolean(intent?.sourceProductId) });
  const checkout = trpc.commerce.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => { window.open(url, "_blank", "noopener,noreferrer"); setIntent(null); toast.success("กำลังเปิดหน้าชำระเงิน", { description: "Stripe Checkout จะตรวจราคาและสิทธิ์อีกครั้ง" }); },
    onError: (error) => toast.error("ยังเริ่มชำระเงินไม่ได้", { description: error.message }),
  });

  const beginCheckout = () => {
    if (!detail.data) return;
    if (!isAuthenticated) { toast.message("เข้าสู่ระบบเพื่อเก็บสิทธิ์ของคุณ"); startLogin(); return; }
    setIntent({ items: [{ productId: detail.data.product.slug, quantity: 1 }], sourceProductId: detail.data.product.slug });
  };

  if (detail.isLoading) return <ProductDetailLoading onOpenCart={() => navigate("/#editions")} />;
  if (!detail.data) return <div className="grid min-h-screen place-items-center bg-[#0a0b0d] text-sm text-white/50">ไม่พบสินค้านี้</div>;
  const { product, preview, includedProducts } = detail.data;

  return <div className="min-h-screen bg-[#0a0b0d] text-white"><StoreHeader onOpenCart={() => navigate("/#editions")} />
    <main className="container py-10 sm:py-16"><Link href="/#editions" className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-white/55 transition hover:text-[#d5ff45]"><ArrowLeft size={14} /> กลับไปหน้าร้าน</Link>
      <section className="detail-enter mt-7 grid gap-9 lg:grid-cols-[0.75fr_1.25fr] lg:items-start"><div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#101312] shadow-[0_24px_80px_rgba(0,0,0,.25)]"><img src={product.coverUrl} alt={`หน้าปก ${product.title}`} className="aspect-[3/3.8] w-full object-cover transition duration-700 hover:scale-[1.025]" /></div>
        <div className="detail-enter" style={{ animationDelay: "80ms" }}><div className="eyebrow text-[#d5ff45]">{formatProductType(product.productType)} · {product.category}</div><h1 className="font-display mt-4 text-5xl leading-[0.92] tracking-[-0.065em] sm:text-7xl">{product.title}</h1>{product.subtitle && <p className="mt-5 text-xl leading-8 text-white/64">{product.subtitle}</p>}<p className="mt-6 max-w-2xl text-sm leading-7 text-white/65">{product.description}</p>
          <div className="mt-7 flex flex-wrap gap-3 text-[10px] font-bold tracking-[0.08em] text-white/58"><span className="rounded-full border border-white/12 px-3 py-2">{formatCurrency(product.priceSatang)}</span><span className="rounded-full border border-white/12 px-3 py-2">{product.productType === "bundle" ? `ปลดล็อก ${product.includedProductIds.length} สินค้า` : `${product.unitCount} ${product.productType === "course" ? "บทเรียน" : "บท"}`}</span><span className="rounded-full border border-white/12 px-3 py-2">{product.durationLabel}</span></div>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2"><button type="button" onClick={() => { addItem(product.slug); toast.success("เพิ่มลงตะกร้าแล้ว"); }} className="rounded-xl border border-white/18 px-4 py-4 text-[10px] font-extrabold tracking-[0.1em] text-white transition hover:border-white/45">เพิ่มลงตะกร้า</button><button type="button" onClick={beginCheckout} className="gradient-cta flex items-center justify-center gap-2 rounded-xl px-4 py-4 text-[10px] font-extrabold tracking-[0.1em] text-black">เลือกและดูข้อเสนอ <ArrowRight size={15} /></button></div><ProductShareActions title={product.title} description={product.subtitle ?? product.description} /></div>
      </section>
      <section className="detail-enter mt-16 border-t border-white/10 pt-10 sm:mt-24 sm:pt-14" style={{ animationDelay: "160ms" }}><div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]"><div><div className="eyebrow text-[#d5ff45]">ลองอ่านก่อนตัดสินใจ</div><h2 className="font-display mt-3 text-4xl tracking-[-0.055em]">ตัวอย่างเนื้อหา</h2><ProductPreviewPresentation preview={preview} /></div>
        <aside className="rounded-[2rem] border border-[#d5ff45]/18 bg-[#d5ff45]/[0.035] p-6"><div className="flex items-center gap-2 text-[#d5ff45]"><BookOpenText size={17} /><span className="text-[10px] font-bold tracking-[0.12em]">สิ่งที่จะได้รับ</span></div>{product.productType === "bundle" ? <div className="mt-5 space-y-3">{includedProducts.map((item) => <Link key={item.slug} href={`/product/${item.slug}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 p-3 transition hover:border-[#d5ff45]/30"><PackageCheck size={15} className="text-[#d5ff45]" /><span className="min-w-0 flex-1 truncate text-sm font-bold">{item.title}</span><ArrowRight size={14} className="text-white/40" /></Link>)}</div> : <ul className="mt-5 space-y-3 text-sm leading-6 text-white/67"><li className="flex gap-3"><Check size={15} className="mt-1 shrink-0 text-[#d5ff45]" />เปิดอ่านหรือเรียนต่อจาก Dashboard ได้ตลอดเวลา</li><li className="flex gap-3"><CirclePlay size={15} className="mt-1 shrink-0 text-[#d5ff45]" />สิทธิ์ผูกกับบัญชีของคุณหลังยืนยันการชำระเงิน</li></ul>}</aside></div></section>
    </main>
    <CheckoutOfferDialog intent={intent} offers={offers.data} isLoading={offers.isLoading} isSubmitting={checkout.isPending} onCancel={() => setIntent(null)} onCheckout={(offerId) => intent && checkout.mutate({ items: intent.items, offerId })} />
  </div>;
}
