import { describe, expect, it } from "vitest";
import { getMemberDashboardStats, getMemberDashboardView } from "./memberDashboardUtils";

describe("getMemberDashboardStats", () => {
  it("returns zero counts when a member has no purchases", () => {
    expect(getMemberDashboardStats([])).toEqual({ total: 0, ebooks: 0, courses: 0 });
  });

  it("separates eBooks and courses for the dashboard summary", () => {
    expect(getMemberDashboardStats([
      { product: { productType: "ebook" } },
      { product: { productType: "course" } },
      { product: { productType: "ebook" } },
    ])).toEqual({ total: 3, ebooks: 2, courses: 1 });
  });
});

describe("getMemberDashboardView", () => {
  it("returns the empty-state signal when a member has no purchased content", () => {
    expect(getMemberDashboardView([])).toEqual({ isEmpty: true, entries: [] });
  });

  it("creates direct reader actions for purchased eBooks and courses", () => {
    expect(getMemberDashboardView([
      { product: { slug: "focus-atlas", productType: "ebook" } },
      { product: { slug: "workflow-course", productType: "course" } },
    ])).toEqual({
      isEmpty: false,
      entries: [
        { slug: "focus-atlas", href: "/read/focus-atlas", actionLabel: "เปิดอ่าน" },
        { slug: "workflow-course", href: "/read/workflow-course", actionLabel: "เรียนต่อ" },
      ],
    });
  });
});
