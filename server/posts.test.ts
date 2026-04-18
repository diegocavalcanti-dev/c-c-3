import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock admin user
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

// Mock regular user
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
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Posts API", () => {
  describe("posts.list", () => {
    it("should return published posts", async () => {
      const caller = appRouter.createCaller(createContext(null));
      const result = await caller.posts.list({ page: 1, limit: 10 });

      expect(result).toHaveProperty("posts");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("pages");
      expect(Array.isArray(result.posts)).toBe(true);
    });

    it("should return posts with pagination", async () => {
      const caller = appRouter.createCaller(createContext(null));
      const result = await caller.posts.list({ page: 1, limit: 5 });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.posts.length).toBeLessThanOrEqual(5);
    });

    it("should filter posts by category", async () => {
      const caller = appRouter.createCaller(createContext(null));
      const result = await caller.posts.list({ page: 1, limit: 10, categoryId: 1 });

      expect(result).toHaveProperty("posts");
      expect(Array.isArray(result.posts)).toBe(true);
    });
  });

  describe("posts.bySlug", () => {
    it("should return post by slug", async () => {
      const caller = appRouter.createCaller(createContext(null));
      // Assuming there's a post with this slug in the database
      const result = await caller.posts.bySlug({ slug: "o-sangue-no-volga" });

      if (result) {
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("title");
        expect(result).toHaveProperty("slug");
        expect(result).toHaveProperty("content");
        expect(result).toHaveProperty("viewCount");
      }
    });

    it("should return null for non-existent slug", async () => {
      const caller = appRouter.createCaller(createContext(null));
      const result = await caller.posts.bySlug({ slug: "non-existent-post-slug" });

      expect(result).toBeNull();
    });
  });

  describe("posts.create (admin only)", () => {
    it("should reject non-admin users", async () => {
      const caller = appRouter.createCaller(createContext(regularUser));

      try {
        await caller.posts.create({
          title: "Test Post",
          slug: "test-post",
          content: "Test content",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should allow admin users to create posts", async () => {
      const caller = appRouter.createCaller(createContext(adminUser));

      const result = await caller.posts.create({
        title: "Test Admin Post",
        slug: `test-admin-post-${Date.now()}`,
        content: "Test admin content",
        status: "draft",
      });

      expect(result).toHaveProperty("id");
      expect(result.title).toBe("Test Admin Post");
      expect(result.status).toBe("draft");
    });
  });

  describe("posts.update (admin only)", () => {
    it("should reject non-admin users", async () => {
      const caller = appRouter.createCaller(createContext(regularUser));

      try {
        await caller.posts.update({
          id: 1,
          title: "Updated Title",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("posts.delete (admin only)", () => {
    it("should reject non-admin users", async () => {
      const caller = appRouter.createCaller(createContext(regularUser));

      try {
        await caller.posts.delete({ id: 1 });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });
});

describe("Categories API", () => {
  describe("categories.list", () => {
    it("should return all categories", async () => {
      const caller = appRouter.createCaller(createContext(null));
      const result = await caller.categories.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should have required category fields", async () => {
      const caller = appRouter.createCaller(createContext(null));
      const result = await caller.categories.list();

      if (result.length > 0) {
        const category = result[0];
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("name");
        expect(category).toHaveProperty("slug");
      }
    });
  });

  describe("categories.create (admin only)", () => {
    it("should reject non-admin users", async () => {
      const caller = appRouter.createCaller(createContext(regularUser));

      try {
        await caller.categories.create({
          name: "Test Category",
          slug: "test-category",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should allow admin users to create categories", async () => {
      const caller = appRouter.createCaller(createContext(adminUser));

      const result = await caller.categories.create({
        name: `Test Category ${Date.now()}`,
        slug: `test-category-${Date.now()}`,
        description: "Test category description",
      });

      expect(result).toHaveProperty("id");
      expect(result.name).toContain("Test Category");
    });
  });
});

describe("Auth API", () => {
  describe("auth.me", () => {
    it("should return current user", async () => {
      const caller = appRouter.createCaller(createContext(adminUser));
      const result = await caller.auth.me();

      expect(result).toEqual(adminUser);
    });

    it("should return null for unauthenticated user", async () => {
      const caller = appRouter.createCaller(createContext(null));
      const result = await caller.auth.me();

      expect(result).toBeNull();
    });
  });

  describe("auth.logout", () => {
    it("should clear session cookie", async () => {
      let clearedCookie = false;
      const mockRes = {
        clearCookie: () => {
          clearedCookie = true;
        },
      } as TrpcContext["res"];

      const context: TrpcContext = {
        user: adminUser,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: mockRes,
      };

      const caller = appRouter.createCaller(context);
      const result = await caller.auth.logout();

      expect(result.success).toBe(true);
      expect(clearedCookie).toBe(true);
    });
  });
});
