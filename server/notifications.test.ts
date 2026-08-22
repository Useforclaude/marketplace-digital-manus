import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  createStoreProduct: vi.fn(),
  createNotificationsForAllUsers: vi.fn(),
  createOrUpdateTestimonial: vi.fn(),
  getProductBySlug: vi.fn(),
  getTestimonialById: vi.fn(),
  hasProductAccess: vi.fn(),
  listAdminOrders: vi.fn(),
  listAdminProducts: vi.fn(),
  listAdminTestimonials: vi.fn(),
  listApprovedTestimonials: vi.fn(),
  listPublishedProducts: vi.fn(),
  listUserNotifications: vi.fn(),
  listUserPurchases: vi.fn(),
  listUserTestimonials: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
  updateStoreProduct: vi.fn(),
  updateTestimonialStatus: vi.fn(),
}));
vi.mock("./storage", () => ({ storagePut: vi.fn() }));

import { createNotificationsForAllUsers, listUserNotifications, markAllNotificationsRead, markNotificationRead } from "./db";
import { appRouter } from "./routers";

function caller(role: "admin" | "user", id = 41) {
  return appRouter.createCaller({ user: { id, openId: `notification-${id}`, name: "Notification User", email: "user@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as never, res: {} as never });
}

describe("notification ownership and delivery", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists and marks notifications only under the authenticated user id", async () => {
    vi.mocked(listUserNotifications).mockResolvedValue([{ id: 9, userId: 41, kind: "product", title: "ใหม่", body: "สินค้า", href: "/#editions", readAt: null, createdAt: new Date() }] as never);
    const result = await caller("user", 41).notifications.list();
    await caller("user", 41).notifications.markRead({ id: 9 });
    await caller("user", 41).notifications.markAllRead();
    expect(result).toHaveLength(1);
    expect(markNotificationRead).toHaveBeenCalledWith({ userId: 41, id: 9 });
    expect(markAllNotificationsRead).toHaveBeenCalledWith(41);
  });

  it("reserves broadcast system updates for administrators", async () => {
    await expect(caller("user").admin.broadcastNotification({ title: "ระบบอัปเดต", body: "รายละเอียด", href: "/" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await caller("admin").admin.broadcastNotification({ title: "ระบบอัปเดต", body: "รายละเอียด", href: "/" });
    expect(createNotificationsForAllUsers).toHaveBeenCalledWith({ kind: "system", title: "ระบบอัปเดต", body: "รายละเอียด", href: "/" });
  });
});
