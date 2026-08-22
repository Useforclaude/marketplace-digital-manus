import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StorefrontHeroActions } from "./StorefrontHeroActions";
import { getStorefrontExperience } from "./storefrontAccess";

describe("StorefrontHeroActions", () => {
  it("renders the visitor CTA as an accessible login button", () => {
    const html = renderToStaticMarkup(<StorefrontHeroActions experience={getStorefrontExperience({ isAuthenticated: false })} onVisitorStart={vi.fn()} />);
    expect(html).toContain("เลือกหมากตัวแรกของคุณ");
    expect(html).toContain("<button");
  });

  it("renders role-specific destination CTAs for user, member, and admin", () => {
    const userHtml = renderToStaticMarkup(<StorefrontHeroActions experience={getStorefrontExperience({ isAuthenticated: true, role: "user" })} onVisitorStart={vi.fn()} />);
    const memberHtml = renderToStaticMarkup(<StorefrontHeroActions experience={getStorefrontExperience({ isAuthenticated: true, role: "user", ownedItemCount: 1 })} onVisitorStart={vi.fn()} />);
    const adminHtml = renderToStaticMarkup(<StorefrontHeroActions experience={getStorefrontExperience({ isAuthenticated: true, role: "admin" })} onVisitorStart={vi.fn()} />);
    expect(userHtml).toContain("เลือกหมากตัวแรกของคุณ");
    expect(memberHtml).toContain("เดินหมากต่อในคลังของคุณ");
    expect(memberHtml).toContain('href="/dashboard"');
    expect(adminHtml).toContain("เข้าสู่กระดานผู้ดูแล");
    expect(adminHtml).toContain('href="/admin"');
  });
});
