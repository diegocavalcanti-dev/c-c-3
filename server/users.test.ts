import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("users router", () => {
  it("should list all users", async () => {
    const adminUser = {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx = {
      user: adminUser,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.users.listAdmins();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should deny access to non-admin users", async () => {
    const regularUser = {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx = {
      user: regularUser,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(ctx);

    try {
      await caller.users.listAdmins();
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});
