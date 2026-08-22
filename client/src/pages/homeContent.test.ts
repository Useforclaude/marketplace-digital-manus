import { describe, expect, it } from "vitest";
import { ACTIVE_HERO_HEADLINE, HERO_HEADLINE_OPTIONS, SOCIAL_PROOF } from "./homeContent";

describe("social-proof content", () => {
  it("labels the section as pending real, consented learner feedback", () => {
    expect(SOCIAL_PROOF.disclosure).toContain("ยังไม่แสดงรีวิวแทนผู้เรียน");
    expect(SOCIAL_PROOF.status).toContain("ผลลัพธ์จริง");
    expect(SOCIAL_PROOF.workflow).toHaveLength(3);
    expect(SOCIAL_PROOF.workflow.at(-1)?.title).toBe("เผยแพร่เมื่อยินยอม");
  });
});

describe("strategy hero copy", () => {
  it("keeps three Thai headline alternatives and selects the strategy-first option", () => {
    expect(HERO_HEADLINE_OPTIONS).toHaveLength(3);
    expect(ACTIVE_HERO_HEADLINE.label).toBe("กลยุทธ์ก่อนหมากแรก");
    expect(ACTIVE_HERO_HEADLINE.highlight).toContain("อ่านเกม");
  });
});
