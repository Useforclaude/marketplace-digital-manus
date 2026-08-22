import { describe, expect, it } from "vitest";
import { toPublicPreview, toPublicProduct } from "./products";

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

  it("returns at most two sanitized public preview sections without exposing paid content", () => {
    const preview = toPublicPreview({
      previewContent: JSON.stringify({ intro: "อ่านได้ก่อนซื้อ", sections: [
        { title: "ตัวอย่างหนึ่ง", body: ["ย่อหน้าที่เปิดเผยได้", "อีกย่อหน้า"] },
        { title: "ตัวอย่างสอง", body: ["เนื้อหาสาธารณะ"] },
        { title: "ต้องไม่ถูกส่ง", body: ["เกินขอบเขต"] },
      ] }),
      content: '{"chapters":[{"title":"ความลับที่ชำระเงินแล้ว"}]}',
    });
    expect(preview?.intro).toBe("อ่านได้ก่อนซื้อ");
    expect(preview?.sections).toHaveLength(2);
    expect(JSON.stringify(preview)).not.toContain("ความลับที่ชำระเงินแล้ว");
  });
});
