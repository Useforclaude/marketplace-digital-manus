import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const bundle = { slug: "focus-foundation", productType: "bundle", status: "published", title: "ชุดตั้งหลักโฟกัส", subtitle: null, description: "รวมเครื่องมือสำหรับงานที่ต้องใช้สมาธิ", category: "การทำงาน", coverUrl: "/bundle.png", priceSatang: 129000, currency: "thb", accent: "lime", unitCount: 2, durationLabel: "2 รายการ", includedProductIds: ["focus-atlas", "decision-playbook"] };

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false, user: null }) }));
vi.mock("@/components/StoreHeader", () => ({ StoreHeader: () => <header>Header</header> }));
vi.mock("@/components/StorefrontHeroActions", () => ({ StorefrontHeroActions: () => <div>Hero actions</div> }));
vi.mock("@/contexts/CartContext", () => ({ useCart: () => ({ addItem: vi.fn(), itemCount: 0, items: [], removeItem: vi.fn(), setQuantity: vi.fn(), subtotal: 0, clearCart: vi.fn() }) }));
vi.mock("@/hooks/useScrollReveal", () => ({ useScrollReveal: () => undefined }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    catalog: { list: { useQuery: () => ({ data: [bundle], isLoading: false }) } },
    testimonials: { listApproved: { useQuery: () => ({ data: [] }) } },
    library: { list: { useQuery: () => ({ data: [] }) } },
    commerce: {
      offers: { useQuery: () => ({ data: { upsells: [], downsells: [] }, isLoading: false }) },
      createCheckoutSession: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import Home from "./Home";

describe("Home Bundle card", () => {
  it("renders a Bundle label, product-specific anchor, and included-product count", () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain("Bundle · ชุดความรู้");
    expect(html).toContain('id="product-focus-foundation"');
    expect(html).toContain("ปลดล็อก 2 สินค้า · 2 รายการ");
  });
});
