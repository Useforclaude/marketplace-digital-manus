import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CheckoutOfferDialog, getDeclinedOfferStage, getInitialOfferStage } from "./CheckoutOfferDialog";

const offer = {
  id: 9, offerType: "upsell" as const, sourceProductId: "atlas-of-attention", offerProductId: "creative-compass",
  title: "เพิ่มเครื่องมือคิด", body: "ข้อเสนอที่ตรวจราคาใน server", ctaLabel: "รับข้อเสนอ", offerTotalPriceSatang: 119000,
  offerProduct: { slug: "creative-compass", productType: "ebook" as const, title: "เข็มทิศความคิดสร้างสรรค์", subtitle: null, description: "รายละเอียด", category: "ความคิด", coverUrl: "/cover.png", accent: "lime" as const, priceSatang: 59000, currency: "thb" as const, unitCount: 1, durationLabel: "1 ชั่วโมง" },
};

describe("CheckoutOfferDialog", () => {
  it("prioritizes upsell, reveals downsell after a decline, then proceeds without an offer", () => {
    expect(getInitialOfferStage({ upsells: [offer], downsells: [{ ...offer, id: 10, offerType: "downsell" }] })).toBe("upsell");
    expect(getDeclinedOfferStage("upsell", { upsells: [offer], downsells: [{ ...offer, id: 10, offerType: "downsell" }] })).toBe("downsell");
    expect(getDeclinedOfferStage("downsell", { upsells: [], downsells: [] })).toBe("checkout");
  });

  it("renders a mobile-safe confirmation dialog when no offer applies", () => {
    const html = renderToStaticMarkup(<CheckoutOfferDialog intent={{ items: [{ productId: "atlas-of-attention", quantity: 1 }], sourceProductId: "atlas-of-attention" }} offers={{ upsells: [], downsells: [] }} isLoading={false} onCancel={vi.fn()} onCheckout={vi.fn()} />);
    expect(html).toContain("พร้อมเริ่มก้าวต่อไปแล้ว");
    expect(html).toContain("px-4");
    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain("เปิด Stripe Checkout");
  });
});
