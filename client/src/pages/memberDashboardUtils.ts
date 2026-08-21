export type MemberDashboardItem = {
  product: { slug: string; productType: "ebook" | "course" };
};

export function getMemberDashboardStats(items: MemberDashboardItem[]) {
  const ebooks = items.filter(({ product }) => product.productType === "ebook").length;
  const courses = items.length - ebooks;
  return { total: items.length, ebooks, courses };
}

export function getMemberDashboardView(items: MemberDashboardItem[]) {
  return {
    isEmpty: items.length === 0,
    entries: items.map(({ product }) => ({
      slug: product.slug,
      href: `/read/${product.slug}`,
      actionLabel: product.productType === "course" ? "เรียนต่อ" : "เปิดอ่าน",
    })),
  };
}
