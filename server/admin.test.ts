import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  createBundle: vi.fn(), createCheckoutOffer: vi.fn(), createNotificationsForAllUsers: vi.fn(), createStoreProduct: vi.fn(), createOrUpdateTestimonial: vi.fn(), getProductBySlug: vi.fn(), getProductsBySlugs: vi.fn(), getPublishedSellablesBySlugs: vi.fn(), getTestimonialById: vi.fn(), hasProductAccess: vi.fn(), listAdminBundles: vi.fn(), listAdminCheckoutOffers: vi.fn(), listAdminOrders: vi.fn(), listAdminProducts: vi.fn(), listAdminTestimonials: vi.fn(), listApprovedTestimonials: vi.fn(), listPublishedBundles: vi.fn(), listPublishedProducts: vi.fn(), listUserPurchases: vi.fn(), listUserTestimonials: vi.fn(), updateBundle: vi.fn(), updateCheckoutOffer: vi.fn(), updateStoreProduct: vi.fn(), updateTestimonialStatus: vi.fn(),
}));
vi.mock("./storage", () => ({ storagePut: vi.fn() }));

import { createBundle, createCheckoutOffer, createNotificationsForAllUsers, createStoreProduct, getProductsBySlugs, getPublishedSellablesBySlugs } from "./db";
import { appRouter } from "./routers";

const mockCreate = vi.mocked(createStoreProduct);
const mockCreateBundle = vi.mocked(createBundle);
const mockBundleProducts = vi.mocked(getProductsBySlugs);
const mockCreateOffer = vi.mocked(createCheckoutOffer);
const mockOfferTargets = vi.mocked(getPublishedSellablesBySlugs);
const validProduct = {
  slug: "thai-test-product", productType: "ebook" as const, status: "draft" as const, title: "สินค้าทดสอบ", subtitle: null, description: "รายละเอียดสินค้าทดสอบที่ยาวเพียงพอ", category: "ทดสอบ", coverUrl: "/manus-storage/cover.png", coverKey: null, accent: "lime" as const, priceSatang: 79000, currency: "thb" as const, unitCount: 1, durationLabel: "10 นาที", content: JSON.stringify({ kind: "ebook", intro: "เกริ่นนำ", chapters: [{ title: "บทหนึ่ง", body: ["เนื้อหา"] }] }),
};
const validBundle = {
  slug: "focus-foundation", status: "draft" as const, title: "ชุดตั้งหลักโฟกัส", subtitle: null, description: "ชุดความรู้สำหรับผู้ที่ต้องการทำงานอย่างมีสมาธิและตัดสินใจได้ชัดเจน", category: "การทำงาน", coverUrl: "/manus-storage/bundle-cover.png", priceSatang: 129000, currency: "thb" as const, productIds: ["atlas-of-attention", "decision-playbook"],
};
const validOffer = {
  status: "published" as const, offerType: "upsell" as const, sourceProductId: "atlas-of-attention", offerProductId: "creative-compass",
  title: "เสริมเครื่องมือคิด", body: "เพิ่มเข็มทิศความคิดสร้างสรรค์ในราคาพิเศษ", ctaLabel: "รับข้อเสนอพิเศษ", offerTotalPriceSatang: 119000, priority: 10,
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

  it("limits Bundle creation to admins and validates every bundled product server-side", async () => {
    await expect(caller("user").admin.createBundle(validBundle)).rejects.toMatchObject({ code: "FORBIDDEN" });
    mockBundleProducts.mockResolvedValue([{ ...validProduct, slug: "atlas-of-attention" }, { ...validProduct, slug: "decision-playbook" }] as never);
    mockCreateBundle.mockResolvedValue({ ...validBundle, productType: "bundle", accent: "lime", unitCount: 2, durationLabel: "2 รายการ", includedProductIds: validBundle.productIds } as never);
    const result = await caller("admin").admin.createBundle(validBundle);
    expect(result?.slug).toBe("focus-foundation");
    expect(mockCreateBundle).toHaveBeenCalledWith(expect.objectContaining({ createdBy: 22, productIds: validBundle.productIds }));
  });

  it("rejects a Bundle when one requested product is absent from the trusted catalog", async () => {
    mockBundleProducts.mockResolvedValue([{ ...validProduct, slug: "atlas-of-attention" }] as never);
    await expect(caller("admin").admin.createBundle(validBundle)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("limits checkout offer management to admins and validates both trusted targets", async () => {
    await expect(caller("user").admin.createCheckoutOffer(validOffer)).rejects.toMatchObject({ code: "FORBIDDEN" });
    mockOfferTargets.mockResolvedValue([{ ...validProduct, slug: "atlas-of-attention", status: "published" }] as never);
    await expect(caller("admin").admin.createCheckoutOffer(validOffer)).rejects.toMatchObject({ code: "BAD_REQUEST" });

    mockOfferTargets.mockResolvedValue([
      { ...validProduct, slug: "atlas-of-attention", status: "published" },
      { ...validProduct, slug: "creative-compass", status: "published" },
    ] as never);
    mockCreateOffer.mockResolvedValue({ ...validOffer, id: 7, createdBy: 22, createdAt: new Date(), updatedAt: new Date() } as never);
    const result = await caller("admin").admin.createCheckoutOffer(validOffer);
    expect(result?.id).toBe(7);
    expect(mockCreateOffer).toHaveBeenCalledWith(expect.objectContaining({ createdBy: 22, offerTotalPriceSatang: 119000 }));
  });

  it("emits product-specific storefront deep links when a product or Bundle is published", async () => {
    mockCreate.mockResolvedValue({ ...validProduct, status: "published", id: 1, createdBy: 22, createdAt: new Date(), updatedAt: new Date() } as never);
    await caller("admin").admin.createProduct({ ...validProduct, status: "published" });
    expect(createNotificationsForAllUsers).toHaveBeenCalledWith(expect.objectContaining({ kind: "product", href: "/#product-thai-test-product" }));

    mockBundleProducts.mockResolvedValue([{ ...validProduct, slug: "atlas-of-attention", status: "published" }, { ...validProduct, slug: "decision-playbook", status: "published" }] as never);
    mockCreateBundle.mockResolvedValue({ ...validBundle, status: "published", productType: "bundle", accent: "lime", unitCount: 2, durationLabel: "2 รายการ", includedProductIds: validBundle.productIds } as never);
    await caller("admin").admin.createBundle({ ...validBundle, status: "published" });
    expect(createNotificationsForAllUsers).toHaveBeenCalledWith(expect.objectContaining({ kind: "product", href: "/#product-focus-foundation" }));
  });
});
