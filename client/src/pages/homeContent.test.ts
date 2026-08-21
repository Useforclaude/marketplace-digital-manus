import { describe, expect, it } from "vitest";
import { SOCIAL_PROOF } from "./homeContent";

describe("social-proof content", () => {
  it("labels the section as pending real, consented learner feedback", () => {
    expect(SOCIAL_PROOF.disclosure).toContain("ยังไม่แสดงรีวิวแทนผู้เรียน");
    expect(SOCIAL_PROOF.status).toContain("ผลลัพธ์จริง");
    expect(SOCIAL_PROOF.workflow).toHaveLength(3);
    expect(SOCIAL_PROOF.workflow.at(-1)?.title).toBe("เผยแพร่เมื่อยินยอม");
  });
});
