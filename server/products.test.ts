import { describe, expect, it } from "vitest";
import { toPublicProduct } from "./products";

describe("public product boundary", () => {
  it("omits protected content and internal persistence fields from browser catalog data", () => {
    const product = toPublicProduct({
      id: 1, slug: "private-product", productType: "course", status: "published", title: "คอร์ส", subtitle: null,
      description: "รายละเอียด", category: "คอร์ส", coverUrl: "/manus-storage/cover.png", coverKey: "private-key", accent: "violet",
      priceSatang: 99000, currency: "thb", unitCount: 1, durationLabel: "1 ชั่วโมง", content: '{"modules":["secret"]}', createdBy: 1, createdAt: new Date(), updatedAt: new Date(),
    });
    expect(product).not.toHaveProperty("content");
    expect(product).not.toHaveProperty("coverKey");
    expect(product).toMatchObject({ slug: "private-product", priceSatang: 99000 });
  });
});
