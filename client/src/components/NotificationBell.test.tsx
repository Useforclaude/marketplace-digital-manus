import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NotificationBellContent } from "./NotificationBell";

const actions = { onRead: vi.fn(), onReadAll: vi.fn() };

describe("NotificationBellContent", () => {
  it("shows an honest empty state when no real notifications exist", () => {
    const html = renderToStaticMarkup(<NotificationBellContent items={[]} {...actions} />);
    expect(html).toContain("ยังไม่มีการแจ้งเตือนใหม่");
  });

  it("renders product and purchase notifications with their protected deep-link destinations", () => {
    const html = renderToStaticMarkup(<NotificationBellContent items={[{ id: 7, kind: "product", title: "มีหมากใหม่บนกระดาน", body: "คอร์สกลยุทธ์", href: "/#product-focus-atlas", readAt: null, createdAt: new Date() }, { id: 8, kind: "purchase", title: "เปิดสิทธิ์แล้ว", body: "พร้อมอ่าน", href: "/read/focus-atlas", readAt: null, createdAt: new Date() }]} {...actions} />);
    expect(html).toContain("มีหมากใหม่บนกระดาน");
    expect(html).toContain('href="/#product-focus-atlas"');
    expect(html).toContain('href="/read/focus-atlas"');
    expect(html).toContain("อ่านทั้งหมด");
  });
});
