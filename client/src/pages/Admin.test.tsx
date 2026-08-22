import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const adminState = vi.hoisted(() => ({
  products: [{ slug: "focus-atlas", productType: "ebook", status: "published", title: "แผนที่แห่งสมาธิ", subtitle: null, description: "รายละเอียด", category: "การทำงาน", coverUrl: "/cover.png", coverKey: null, accent: "lime", priceSatang: 79000, currency: "thb", unitCount: 8, durationLabel: "72 นาที", content: "{}" }],
  bundles: [{ slug: "focus-foundation", status: "published", title: "ชุดตั้งหลักโฟกัส", subtitle: null, description: "รายละเอียดชุด", category: "การทำงาน", coverUrl: "/bundle.png", priceSatang: 129000, currency: "thb", productType: "bundle", accent: "lime", unitCount: 2, durationLabel: "2 รายการ", includedProductIds: ["focus-atlas", "decision-playbook"] }],
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: "admin" } }) }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    admin: {
      listProducts: { useQuery: () => ({ data: adminState.products, isLoading: false }) },
      listBundles: { useQuery: () => ({ data: adminState.bundles, isLoading: false }) },
      listCheckoutOffers: { useQuery: () => ({ data: [], isLoading: false }) },
      listOrders: { useQuery: () => ({ data: [], isLoading: false }) },
      listTestimonials: { useQuery: () => ({ data: [], isLoading: false }) },
      createProduct: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      updateProduct: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      uploadCover: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      createBundle: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      updateBundle: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      createCheckoutOffer: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      updateCheckoutOffer: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      updateTestimonialStatus: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      broadcastNotification: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    useUtils: () => ({ admin: { listProducts: { invalidate: vi.fn() }, listBundles: { invalidate: vi.fn() }, listCheckoutOffers: { invalidate: vi.fn() }, listTestimonials: { invalidate: vi.fn() } }, catalog: { list: { invalidate: vi.fn() } } }),
  },
}));

import Admin, { bundleRecordToForm, normalizeBroadcastPayload, toggleBundleProductIds } from "./Admin";

const originalWindow = globalThis.window;

function renderTab(tab: "bundles" | "notifications") {
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { search: `?tab=${tab}` }, scrollTo: vi.fn() } });
  return renderToStaticMarkup(<Admin />);
}

describe("Admin Bundle and Broadcast tabs", () => {
  afterEach(() => Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow }));

  it("renders Bundle composition controls and existing bundle details from the tab query", () => {
    const html = renderTab("bundles");
    expect(html).toContain("Bundle ในร้าน");
    expect(html).toContain("ชุดตั้งหลักโฟกัส");
    expect(html).toContain("สินค้าใน Bundle");
    expect(html).toContain("แผนที่แห่งสมาธิ");
  });

  it("renders the broadcast composer and validates the internal-link guidance from the tab query", () => {
    const html = renderTab("notifications");
    expect(html).toContain("ส่งประกาศถึงผู้ใช้");
    expect(html).toContain("ลิงก์ปลายทางภายในเว็บไซต์");
    expect(html).toContain("/read/slug");
    expect(html).toContain("ส่งประกาศระบบ");
  });

  it("preserves selected product membership and converts an existing Bundle to editable form state", () => {
    expect(toggleBundleProductIds(["focus-atlas"], "decision-playbook")).toEqual(["focus-atlas", "decision-playbook"]);
    expect(toggleBundleProductIds(["focus-atlas", "decision-playbook"], "focus-atlas")).toEqual(["decision-playbook"]);
    expect(bundleRecordToForm({ ...adminState.bundles[0], status: "published" as const, previewContent: null }).productIds).toEqual(["focus-atlas", "decision-playbook"]);
  });

  it("normalizes broadcast form input into the mutation-safe internal payload", () => {
    expect(normalizeBroadcastPayload({ title: "  ประกาศใหม่  ", body: "  รายละเอียด  ", href: "  /dashboard  " })).toEqual({ title: "ประกาศใหม่", body: "รายละเอียด", href: "/dashboard" });
    expect(normalizeBroadcastPayload({ title: "ประกาศ", body: "รายละเอียด", href: "   " })).toEqual({ title: "ประกาศ", body: "รายละเอียด", href: "/" });
  });
});
