import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  createStoreProduct: vi.fn(),
  createOrUpdateTestimonial: vi.fn(),
  getProductBySlug: vi.fn(),
  getTestimonialById: vi.fn(),
  hasProductAccess: vi.fn(),
  listAdminOrders: vi.fn(),
  listAdminProducts: vi.fn(),
  listAdminTestimonials: vi.fn(),
  listApprovedTestimonials: vi.fn(),
  listPublishedProducts: vi.fn(),
  listUserPurchases: vi.fn(),
  listUserTestimonials: vi.fn(),
  updateStoreProduct: vi.fn(),
  updateTestimonialStatus: vi.fn(),
}));
vi.mock("./storage", () => ({ storagePut: vi.fn() }));

import { createOrUpdateTestimonial, getTestimonialById, hasProductAccess, listApprovedTestimonials, updateTestimonialStatus } from "./db";
import { appRouter } from "./routers";

const mockAccess = vi.mocked(hasProductAccess);
const mockCreate = vi.mocked(createOrUpdateTestimonial);
const mockGetTestimonial = vi.mocked(getTestimonialById);
const mockListApproved = vi.mocked(listApprovedTestimonials);
const mockUpdateStatus = vi.mocked(updateTestimonialStatus);
const testFeedback = "x".repeat(30);

function caller(role: "admin" | "user") {
  return appRouter.createCaller({
    user: { id: role === "admin" ? 71 : 72, openId: `testimonial-${role}`, name: "Test", email: "test@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as never,
    res: {} as never,
  });
}

describe("testimonial workflow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires publication consent and a paid entitlement before accepting a submission", async () => {
    await expect(caller("user").testimonials.submit({ productId: "owned-product", displayName: "Test", feedback: testFeedback, consentToPublish: false as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    mockAccess.mockResolvedValue(false);
    await expect(caller("user").testimonials.submit({ productId: "owned-product", displayName: "Test", feedback: testFeedback, consentToPublish: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("submits only real-member feedback for moderation and exposes only approved items publicly", async () => {
    mockAccess.mockResolvedValue(true);
    mockCreate.mockResolvedValue({ id: 8, status: "pending" } as never);
    mockListApproved.mockResolvedValue([]);

    const submission = await caller("user").testimonials.submit({ productId: "owned-product", displayName: "Test", feedback: testFeedback, consentToPublish: true });
    const publicItems = await caller("user").testimonials.listApproved();

    expect(submission).toMatchObject({ id: 8, status: "pending" });
    expect(mockCreate).toHaveBeenCalledWith({ userId: 72, productId: "owned-product", displayName: "Test", feedback: testFeedback });
    expect(publicItems).toEqual([]);
  });

  it("reserves status moderation for administrators", async () => {
    await expect(caller("user").admin.updateTestimonialStatus({ id: 8, status: "approved" })).rejects.toMatchObject({ code: "FORBIDDEN" });

    mockGetTestimonial.mockResolvedValue({ id: 8, consentToPublish: true } as never);
    mockUpdateStatus.mockResolvedValue({ id: 8, status: "approved" });
    await expect(caller("admin").admin.updateTestimonialStatus({ id: 8, status: "approved" })).resolves.toEqual({ id: 8, status: "approved" });
    expect(mockUpdateStatus).toHaveBeenCalledWith({ id: 8, status: "approved", reviewedBy: 71 });

    mockUpdateStatus.mockResolvedValue({ id: 8, status: "rejected" });
    await expect(caller("admin").admin.updateTestimonialStatus({ id: 8, status: "rejected" })).resolves.toEqual({ id: 8, status: "rejected" });
    expect(mockUpdateStatus).toHaveBeenLastCalledWith({ id: 8, status: "rejected", reviewedBy: 71 });
  });

  it("does not approve feedback that has no publication consent", async () => {
    mockGetTestimonial.mockResolvedValue({ id: 8, consentToPublish: false } as never);
    await expect(caller("admin").admin.updateTestimonialStatus({ id: 8, status: "approved" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });
});
