import { describe, expect, it } from "vitest";
import { getRouteRedirectNotice } from "./routeAccess";

describe("route access redirect feedback", () => {
  it("explains why a visitor cannot enter admin", () => {
    expect(getRouteRedirectNotice({ target: "admin", isAuthenticated: false })).toMatchObject({
      to: "/",
      title: "เข้าสู่ระบบก่อนใช้งานหลังบ้าน",
    });
  });

  it("keeps user and admin destinations separate", () => {
    expect(getRouteRedirectNotice({ target: "admin", isAuthenticated: true, role: "user" })?.to).toBe("/dashboard");
    expect(getRouteRedirectNotice({ target: "member", isAuthenticated: true, role: "admin" })?.to).toBe("/admin");
    expect(getRouteRedirectNotice({ target: "member", isAuthenticated: true, role: "user" })).toBeNull();
  });
});
