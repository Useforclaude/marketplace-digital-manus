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

  it("renders unread product notifications with the correct destination", () => {
    const html = renderToStaticMarkup(<NotificationBellContent items={[{ id: 7, kind: "product", title: "มีหมากใหม่บนกระดาน", body: "คอร์สกลยุทธ์", href: "/#editions", readAt: null, createdAt: new Date() }]} {...actions} />);
    expect(html).toContain("มีหมากใหม่บนกระดาน");
    expect(html).toContain('href="/#editions"');
    expect(html).toContain("อ่านทั้งหมด");
  });
});
