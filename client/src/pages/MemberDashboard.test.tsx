import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dashboardState = vi.hoisted(() => ({
  library: [] as unknown[],
  testimonials: [] as unknown[],
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: { name: "Kim Brightline" },
  }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    library: {
      list: {
        useQuery: () => ({ data: dashboardState.library, isLoading: false }),
      },
    },
    testimonials: {
      listMine: {
        useQuery: () => ({ data: dashboardState.testimonials, isLoading: false }),
      },
      submit: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
    },
    notifications: {
      preferences: {
        useQuery: () => ({ data: { productEnabled: true, purchaseEnabled: true, systemEnabled: true }, isLoading: false }),
      },
      updatePreferences: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
    },
    useUtils: () => ({ testimonials: { listMine: { invalidate: vi.fn() } }, notifications: { preferences: { invalidate: vi.fn() } } }),
  },
}));

vi.mock("@/hooks/useScrollReveal", () => ({ useScrollReveal: () => undefined }));
vi.mock("@/components/StoreHeader", () => ({ StoreHeader: () => <header>Store header</header> }));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));

import MemberDashboard, { buildNotificationPreferenceUpdate } from "./MemberDashboard";

const ebook = {
  product: {
    slug: "focus-atlas",
    productType: "ebook",
    coverUrl: "/cover.png",
    title: "แผนที่แห่งสมาธิ",
    subtitle: "หยุดให้สิ่งรบกวนกำหนดวันของคุณ",
    description: "รายละเอียด",
    unitCount: 8,
    durationLabel: "72 นาที",
  },
  purchasedAt: new Date("2026-08-21T00:00:00.000Z"),
};

const course = {
  product: {
    slug: "workflow-course",
    productType: "course",
    coverUrl: "/course.png",
    title: "คอร์สออกแบบระบบงานดิจิทัล",
    subtitle: "ทำงานอย่างมีระบบ",
    description: "รายละเอียด",
    unitCount: 6,
    durationLabel: "4 ชั่วโมง",
  },
  purchasedAt: new Date("2026-08-20T00:00:00.000Z"),
};

describe("MemberDashboard", () => {
  beforeEach(() => {
    dashboardState.library = [];
    dashboardState.testimonials = [];
  });

  it("renders an actionable empty state when the member has no purchases", () => {
    const html = renderToStaticMarkup(<MemberDashboard />);

    expect(html).toContain("พื้นที่นี้พร้อมรอสิ่งแรกของคุณ");
    expect(html).toContain('href="/#editions"');
    expect(html).toContain("การแจ้งเตือนของคุณ");
    expect(html).toContain("สินค้าและ Bundle ใหม่");
    expect(html).toContain("ยืนยันสิทธิ์การซื้อ");
    expect((html.match(/role="switch"/g) ?? [])).toHaveLength(3);
    expect((html.match(/checked=""/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it("renders purchased content, purchase history, and direct eBook/course actions", () => {
    dashboardState.library = [ebook, course];
    const html = renderToStaticMarkup(<MemberDashboard />);

    expect(html).toContain("แผนที่แห่งสมาธิ");
    expect(html).toContain("คอร์สออกแบบระบบงานดิจิทัล");
    expect(html).toContain("ประวัติการสั่งซื้อ");
    expect(html).toContain('href="/read/focus-atlas"');
    expect(html).toContain('href="/read/workflow-course"');
    expect(html).toContain("เปิดอ่าน");
    expect(html).toContain("เรียนต่อ");
    expect(html).toContain("เสียงจากผู้เรียนจริง");
    expect(html).toContain("ส่งให้ทีมตรวจสอบ");
  });

  it("builds the correct toggle payload for product, purchase, and system preferences", () => {
    const current = { productEnabled: true, purchaseEnabled: true, systemEnabled: true };
    expect(buildNotificationPreferenceUpdate(current, "productEnabled", false)).toEqual({ productEnabled: false, purchaseEnabled: true, systemEnabled: true });
    expect(buildNotificationPreferenceUpdate(current, "purchaseEnabled", false)).toEqual({ productEnabled: true, purchaseEnabled: false, systemEnabled: true });
    expect(buildNotificationPreferenceUpdate(current, "systemEnabled", false)).toEqual({ productEnabled: true, purchaseEnabled: true, systemEnabled: false });
  });
});
