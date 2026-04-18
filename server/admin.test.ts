import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

function createContext(user: typeof adminUser | typeof regularUser | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("Admin Posts Management", () => {
  describe("posts.adminList", () => {
    it("should reject non-admin users", async () => {
      const caller = appRouter.createCaller(createContext(regularUser));
      try {
        await caller.posts.adminList({ page: 1, limit: 10 });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should allow admin to list all posts", async () => {
      const caller = appRouter.createCaller(createContext(adminUser));
      const result = await caller.posts.adminList({ page: 1, limit: 10 });
      expect(result.posts).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe("posts.create", () => {
    it("should create a draft post", async () => {
      const caller = appRouter.createCaller(createContext(adminUser));
      const result = await caller.posts.create({
        title: "Test Admin Post",
        slug: `test-admin-${Date.now()}`,
        content: "Test content",
        status: "draft",
      });
      expect(result).toBeDefined();
      expect(result.title).toBe("Test Admin Post");
      expect(result.status).toBe("draft");
    });

    it("should reject non-admin users", async () => {
      const caller = appRouter.createCaller(createContext(regularUser));
      try {
        await caller.posts.create({
          title: "Unauthorized",
          slug: "unauthorized",
          content: "content",
        });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });
});

describe("Admin Categories Management", () => {
  describe("categories.create", () => {
    it("should create a category", async () => {
      const caller = appRouter.createCaller(createContext(adminUser));
      const result = await caller.categories.create({
        name: `Test Cat ${Date.now()}`,
        slug: `test-cat-${Date.now()}`,
      });
      expect(result).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.slug).toBeDefined();
    });

    it("should reject non-admin users", async () => {
      const caller = appRouter.createCaller(createContext(regularUser));
      try {
        await caller.categories.create({
          name: "Unauthorized",
          slug: "unauthorized",
        });
        expect.fail("Should have thrown FORBIDDEN");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });
});
