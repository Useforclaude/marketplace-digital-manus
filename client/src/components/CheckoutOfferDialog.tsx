import type { PublicCheckoutOffer } from "@shared/products";
import { formatCurrencyFromSatang } from "@shared/products";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import React, { useEffect, useState } from "react";

type CheckoutItem = { productId: string; quantity: number };

type Props = {
  intent: { items: CheckoutItem[]; sourceProductId: string } | null;
  offers?: { upsells: PublicCheckoutOffer[]; downsells: PublicCheckoutOffer[] };
  isLoading: boolean;
  isSubmitting?: boolean;
  onCancel: () => void;
  onCheckout: (offerId?: number) => void;
};

export function getInitialOfferStage(offers: Props["offers"]): "upsell" | "downsell" | "confirm" {
  return offers?.upsells[0] ? "upsell" : offers?.downsells[0] ? "downsell" : "confirm";
}

export function getDeclinedOfferStage(stage: "upsell" | "downsell" | "confirm", offers: Props["offers"]): "downsell" | "checkout" {
  return stage === "upsell" && offers?.downsells[0] ? "downsell" : "checkout";
}

export function CheckoutOfferDialog({ intent, offers, isLoading, isSubmitting = false, onCancel, onCheckout }: Props) {
  const [stage, setStage] = useState<"upsell" | "downsell" | "confirm">("confirm");
  useEffect(() => {
    if (!intent) return;
    if (isLoading) return;
    setStage(getInitialOfferStage(offers));
  }, [intent, isLoading, offers?.downsells, offers?.upsells]);

  if (!intent) return null;
  const offer = stage === "upsell" ? offers?.upsells[0] : stage === "downsell" ? offers?.downsells[0] : null;
  const goToCheckout = (offerId?: number) => onCheckout(offerId);
  const decline = () => {
    const next = getDeclinedOfferStage(stage, offers);
    if (next === "downsell") setStage(next);
    else goToCheckout();
  };

  return <div className="fixed inset-0 z-[70] grid place-items-center px-4" role="dialog" aria-modal="true" aria-label="ข้อเสนอพิเศษก่อนชำระเงิน">
    <button type="button" onClick={onCancel} className="absolute inset-0 bg-black/78 backdrop-blur-sm" aria-label="ปิดข้อเสนอ" />
    <section className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/14 bg-[#111513] p-6 shadow-2xl sm:p-8">
      <button type="button" onClick={onCancel} className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full border border-white/12 text-white/60 transition hover:text-white" aria-label="ปิด"><X size={15} /></button>
      {isLoading ? <div className="grid min-h-64 place-items-center text-sm text-white/56"><div className="flex items-center gap-3"><Loader2 className="animate-spin text-[#d5ff45]" size={18} /> กำลังตรวจข้อเสนอที่เหมาะกับคุณ…</div></div> : offer ? <div>
        <div className="eyebrow text-[#d5ff45]">{stage === "upsell" ? "ก่อนชำระเงิน ขอแนะนำอีกหนึ่งก้าว" : "ข้อเสนอพิเศษสำหรับคุณตอนนี้"}</div>
        <div className="mt-4 flex gap-5"><img src={offer.offerProduct.coverUrl} alt="" className="h-32 w-24 rounded-xl object-cover" /><div className="min-w-0"><h2 className="font-display text-3xl leading-none tracking-[-0.05em]">{offer.title}</h2><p className="mt-3 text-sm leading-6 text-white/60">{offer.body}</p><div className="mt-4 text-xs font-bold text-[#d5ff45]">รวมวันนี้ {formatCurrencyFromSatang(offer.offerTotalPriceSatang)}</div></div></div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2"><button type="button" disabled={isSubmitting} onClick={decline} className="rounded-xl border border-white/16 px-4 py-3 text-[10px] font-bold tracking-[0.08em] text-white/72 transition hover:text-white">{stage === "upsell" && offers?.downsells[0] ? "ไม่เอา ดูข้อเสนออื่น" : "ไม่เพิ่ม ไปชำระเงิน"}</button><button type="button" disabled={isSubmitting} onClick={() => goToCheckout(offer.id)} className="gradient-cta flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[10px] font-extrabold tracking-[0.08em] text-black disabled:opacity-60"><Check size={14} /> {offer.ctaLabel}</button></div>
      </div> : <div><div className="eyebrow text-[#d5ff45]">ตรวจรายการก่อนชำระเงิน</div><h2 className="font-display mt-4 text-4xl tracking-[-0.055em]">พร้อมเริ่มก้าวต่อไปแล้ว</h2><p className="mt-3 text-sm leading-6 text-white/60">รายการและราคาจะถูกตรวจสอบอีกครั้งบนเซิร์ฟเวอร์ก่อนเปิด Stripe Checkout เพื่อคงสิทธิ์ของคุณอย่างปลอดภัย</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><button type="button" onClick={onCancel} className="rounded-xl border border-white/16 px-4 py-3 text-[10px] font-bold tracking-[0.08em] text-white/72">กลับไปดูก่อน</button><button type="button" disabled={isSubmitting} onClick={() => goToCheckout()} className="gradient-cta flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[10px] font-extrabold tracking-[0.08em] text-black disabled:opacity-60">เปิด Stripe Checkout <ArrowRight size={14} /></button></div></div>}
    </section>
  </div>;
}
