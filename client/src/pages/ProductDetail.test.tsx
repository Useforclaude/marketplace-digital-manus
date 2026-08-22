import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProductDetailLoading, ProductPreviewPresentation } from "./ProductDetail";

describe("Product Detail presentation", () => {
  it("renders an animated skeleton rather than a blank loading screen", () => {
    const html = renderToStaticMarkup(<ProductDetailLoading withHeader={false} />);
    expect(html).toContain("detail-shimmer");
    expect(html).toContain("กำลังเรียงรายละเอียดให้อ่านง่าย");
  });

  it("renders numbered preview cards and a clear empty preview state", () => {
    const previewHtml = renderToStaticMarkup(<ProductPreviewPresentation preview={{ intro: "ลองอ่านก่อน", sections: [{ kicker: "บทเปิด", title: "เริ่มจากจุดเดียว", body: ["ย่อหน้าตัวอย่าง"] }] }} />);
    expect(previewHtml).toContain("detail-preview-card");
    expect(previewHtml).toContain("01");
    expect(previewHtml).toContain("เริ่มจากจุดเดียว");

    const emptyHtml = renderToStaticMarkup(<ProductPreviewPresentation preview={null} />);
    expect(emptyHtml).toContain("ผู้ดูแลยังไม่ได้เปิดตัวอย่าง");
  });
});
