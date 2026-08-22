import { describe, expect, it } from "vitest";
import { getStorefrontExperience } from "./storefrontAccess";

describe("storefront role-aware experience", () => {
  it("keeps the admin route out of visitor, user, and member navigation", () => {
    for (const input of [
      { isAuthenticated: false },
      { isAuthenticated: true, role: "user", ownedItemCount: 0 },
      { isAuthenticated: true, role: "user", ownedItemCount: 1 },
    ]) {
      expect(getStorefrontExperience(input).navigation.some((item) => item.href === "/admin")).toBe(false);
    }
  });

  it("gives each audience an intentional home experience", () => {
    expect(getStorefrontExperience({ isAuthenticated: false }).primaryCta).toMatchObject({
      label: "เลือกหมากตัวแรกของคุณ",
      requiresLogin: true,
    });
    expect(getStorefrontExperience({ isAuthenticated: true, role: "user", ownedItemCount: 0 }).audience).toBe("user");
    expect(getStorefrontExperience({ isAuthenticated: true, role: "user", ownedItemCount: 2 }).primaryCta.label).toContain("เดินหมากต่อ");
    expect(getStorefrontExperience({ isAuthenticated: true, role: "admin" }).navigation.at(-1)).toMatchObject({ href: "/admin" });
  });
});
