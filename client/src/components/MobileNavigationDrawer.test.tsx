import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MobileNavigationDrawerContent } from "./MobileNavigationDrawer";
import { getStorefrontExperience } from "./storefrontAccess";

vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => React.createElement("a", { href, ...props }, children) }));

const callbacks = { onNavigate: vi.fn(), onLogin: vi.fn(), onLogout: vi.fn() };

describe("MobileNavigationDrawerContent", () => {
  it("shows visitor login without privileged routes", () => {
    const html = renderToStaticMarkup(<MobileNavigationDrawerContent experience={getStorefrontExperience({ isAuthenticated: false })} user={null} {...callbacks} />);
    expect(html).toContain("เริ่มเลือกหมาก");
    expect(html).not.toContain("/admin");
  });

  it("shows identity and management navigation only for admins", () => {
    const html = renderToStaticMarkup(<MobileNavigationDrawerContent experience={getStorefrontExperience({ isAuthenticated: true, role: "admin" })} user={{ name: "Brightline Owner", email: "owner@example.com" }} {...callbacks} />);
    expect(html).toContain("Brightline Owner");
    expect(html).toContain("จัดการร้าน");
    expect(html).toContain("/admin");
    expect(html).not.toContain("/dashboard");
  });

  it("shows the library entry for members without exposing admin navigation", () => {
    const html = renderToStaticMarkup(<MobileNavigationDrawerContent experience={getStorefrontExperience({ isAuthenticated: true, role: "user", ownedItemCount: 1 })} user={{ name: "Member One" }} {...callbacks} />);
    expect(html).toContain("คลังของฉัน");
    expect(html).toContain("/dashboard");
    expect(html).not.toContain("/admin");
  });
});
