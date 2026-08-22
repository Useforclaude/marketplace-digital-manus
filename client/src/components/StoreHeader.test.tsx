import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = {
  user: null as { role: "user" | "admin" } | null,
  isAuthenticated: false,
  loading: false,
  logout: vi.fn(),
};
let libraryItems: unknown[] = [];

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("@/contexts/CartContext", () => ({ useCart: () => ({ itemCount: 0 }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: { library: { list: { useQuery: () => ({ data: libraryItems }) } } },
}));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => React.createElement("a", { href, ...props }, children),
}));

import { StoreHeader } from "./StoreHeader";

function renderHeader() {
  return renderToStaticMarkup(<StoreHeader onOpenCart={() => undefined} />);
}

describe("StoreHeader role-aware navigation", () => {
  beforeEach(() => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.loading = false;
    libraryItems = [];
  });

  it("shows visitor login language and no admin navigation", () => {
    const html = renderHeader();
    expect(html).toContain("เริ่มเลือกหมาก");
    expect(html).not.toContain("/admin");
  });

  it("shows account access for a signed-in user without purchases", () => {
    authState.user = { role: "user" };
    authState.isAuthenticated = true;
    const html = renderHeader();
    expect(html).toContain("บัญชีของฉัน");
    expect(html).not.toContain("/admin");
  });

  it("shows a library entry for a member with entitlements", () => {
    authState.user = { role: "user" };
    authState.isAuthenticated = true;
    libraryItems = [{}];
    expect(renderHeader()).toContain("คลังของฉัน");
  });

  it("shows management-only navigation for admins", () => {
    authState.user = { role: "admin" };
    authState.isAuthenticated = true;
    const html = renderHeader();
    expect(html).toContain("จัดการร้าน");
    expect(html).toContain("/admin");
    expect(html).not.toContain("/dashboard");
  });
});
