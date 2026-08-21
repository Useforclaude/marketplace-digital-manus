import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  createStoreProduct: vi.fn(), getProductBySlug: vi.fn(), hasProductAccess: vi.fn(), listAdminOrders: vi.fn(), listAdminProducts: vi.fn(), listPublishedProducts: vi.fn(), listUserPurchases: vi.fn(), updateStoreProduct: vi.fn(),
}));
vi.mock("./storage", () => ({ storagePut: vi.fn() }));

import { createStoreProduct } from "./db";
import { appRouter } from "./routers";

const mockCreate = vi.mocked(createStoreProduct);
const validProduct = {
  slug: "thai-test-product", productType: "ebook" as const, status: "draft" as const, title: "สินค้าทดสอบ", subtitle: null, description: "รายละเอียดสินค้าทดสอบที่ยาวเพียงพอ", category: "ทดสอบ", coverUrl: "/manus-storage/cover.png", coverKey: null, accent: "lime" as const, priceSatang: 79000, currency: "thb" as const, unitCount: 1, durationLabel: "10 นาที", content: JSON.stringify({ kind: "ebook", intro: "เกริ่นนำ", chapters: [{ title: "บทหนึ่ง", body: ["เนื้อหา"] }] }),
};

function caller(role: "admin" | "user") {
  return appRouter.createCaller({ user: { id: 22, openId: `test-${role}`, name: "Test", email: "test@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as never, res: {} as never });
}

describe("administrator product controls", () => {
  beforeEach(() => vi.clearAllMocks());

  it("denies product management to non-admin members", async () => {
    await expect(caller("user").admin.listProducts()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("creates a product only when server validation accepts the commercial data", async () => {
    mockCreate.mockResolvedValue({ ...validProduct, id: 1, createdBy: 22, createdAt: new Date(), updatedAt: new Date() } as never);
    const result = await caller("admin").admin.createProduct(validProduct);
    expect(result?.slug).toBe("thai-test-product");
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ createdBy: 22, priceSatang: 79000 }));
  });

  it("rejects malformed protected content and non-image uploads before storage", async () => {
    await expect(caller("admin").admin.createProduct({ ...validProduct, content: "{not-json" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller("admin").admin.uploadCover({ dataUrl: "data:text/plain;base64,SGVsbG8=" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
