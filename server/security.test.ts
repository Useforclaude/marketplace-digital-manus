import { describe, expect, it } from "vitest";
import { consumeRateLimit } from "./security";

describe("high-risk mutation rate limiting", () => {
  it("allows requests within a window then blocks the excess request", () => {
    expect(consumeRateLimit("test-checkout", "member-1", 2, 60_000)).toBe(true);
    expect(consumeRateLimit("test-checkout", "member-1", 2, 60_000)).toBe(true);
    expect(consumeRateLimit("test-checkout", "member-1", 2, 60_000)).toBe(false);
  });
});
