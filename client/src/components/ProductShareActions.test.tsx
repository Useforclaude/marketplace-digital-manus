import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildProductShareLinks, ProductShareActions } from "./ProductShareActions";

describe("ProductShareActions", () => {
  it("creates encoded social share URLs without trusting unescaped product copy", () => {
    const links = buildProductShareLinks("https://brightline.example/product/atlas?ref=a b", "แผนที่ & สมาธิ");
    expect(links.facebook).toContain("https%3A%2F%2Fbrightline.example%2Fproduct%2Fatlas%3Fref%3Da%20b");
    expect(links.x).toContain("%E0%B9%81%E0%B8%9C%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%88%20%26%20%E0%B8%AA%E0%B8%A1%E0%B8%B2%E0%B8%98%E0%B8%B4");
    expect(links.line).toContain("social-plugins.line.me");
  });

  it("renders native-share, copy, LINE, Facebook, and X actions", () => {
    const html = renderToStaticMarkup(<ProductShareActions title="แผนที่แห่งสมาธิ" description="หยุดให้สิ่งรบกวนกำหนดวันของคุณ" />);
    expect(html).toContain("คัดลอกลิงก์");
    expect(html).toContain("LINE");
    expect(html).toContain("Facebook");
    expect(html).toContain('aria-label="แชร์ไป X"');
  });
});
