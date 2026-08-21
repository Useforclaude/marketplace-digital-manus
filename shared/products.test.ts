import { describe, expect, it } from "vitest";
import { formatCurrencyFromSatang } from "./products";

describe("Thai product presentation", () => {
  it("formats satang as a Thai-baht display amount", () => {
    const amount = formatCurrencyFromSatang(79000);
    expect(amount).toContain("790");
    expect(amount).toMatch(/฿|THB/);
  });

  it("does not expose a static in-source catalog as a payment authority", async () => {
    expect("products" in (await import("./products"))).toBe(false);
  });
});
