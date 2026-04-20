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

function createContext(user: typeof adminUser | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("Published At Field", () => {
  describe("cms.createPost", () => {
    it("should create a published post with custom publishedAt date", async () => {
      const caller = appRouter.createCaller(createContext(adminUser));
      const customDate = new Date("2026-01-15T10:30:00Z");
      
      const result = await caller.cms.createPost({
        title: "Test Published At",
        slug: `test-published-${Date.now()}`,
        content: "Test content",
        status: "published",
        publishedAt: customDate.toISOString(),
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      
      // Fetch the post to verify publishedAt was saved
      const post = await caller.cms.getPost({ id: result.id });
      expect(post).toBeDefined();
      expect(post.publishedAt).toBeDefined();
      
      // The date should match (allowing for minor time differences)
      const savedDate = new Date(post.publishedAt);
      expect(savedDate.getTime()).toBe(customDate.getTime());
    });

    it("should create a draft post without publishedAt", async () => {
      const caller = appRouter.createCaller(createContext(adminUser));
      
      const result = await caller.cms.createPost({
        title: "Test Draft",
        slug: `test-draft-${Date.now()}`,
        content: "Test content",
        status: "draft",
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      
      // Fetch the post to verify publishedAt is null
      const post = await caller.cms.getPost({ id: result.id });
      expect(post).toBeDefined();
      expect(post.publishedAt).toBeNull();
    });

    it("should set publishedAt to now when publishing a draft without explicit date", async () => {
      const caller = appRouter.createCaller(createContext(adminUser));
      const beforeCreate = new Date();
      beforeCreate.setSeconds(beforeCreate.getSeconds() - 1); // Allow 1 second buffer
      
      const result = await caller.cms.createPost({
        title: "Test Auto Publish",
        slug: `test-auto-${Date.now()}`,
        content: "Test content",
        status: "published",
      });
      
      const afterCreate = new Date();
      afterCreate.setSeconds(afterCreate.getSeconds() + 1); // Allow 1 second buffer
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      
      // Fetch the post to verify publishedAt was set
      const post = await caller.cms.getPost({ id: result.id });
      expect(post).toBeDefined();
      expect(post.publishedAt).toBeDefined();
      
      // The publishedAt should be between beforeCreate and afterCreate
      const publishedAt = new Date(post.publishedAt);
      expect(publishedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(publishedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe("cms.updatePost", () => {
    it("should update publishedAt when changing status to published", async () => {
      const caller = appRouter.createCaller(createContext(adminUser));
      
      // Create a draft post
      const createResult = await caller.cms.createPost({
        title: "Test Update Published",
        slug: `test-update-${Date.now()}`,
        content: "Test content",
        status: "draft",
      });
      
      const postId = createResult.id;
      
      // Update to published with custom date
      const customDate = new Date("2026-02-20T14:45:00Z");
      await caller.cms.updatePost({
        id: postId,
        status: "published",
        publishedAt: customDate.toISOString(),
      });
      
      // Fetch the post to verify publishedAt was updated
      const post = await caller.cms.getPost({ id: postId });
      expect(post).toBeDefined();
      expect(post.status).toBe("published");
      expect(post.publishedAt).toBeDefined();
      
      const savedDate = new Date(post.publishedAt);
      expect(savedDate.getTime()).toBe(customDate.getTime());
    });

    it("should preserve publishedAt when updating other fields", async () => {
      const caller = appRouter.createCaller(createContext(adminUser));
      const customDate = new Date("2026-03-10T08:00:00Z");
      
      // Create a published post with custom date
      const createResult = await caller.cms.createPost({
        title: "Test Preserve Date",
        slug: `test-preserve-${Date.now()}`,
        content: "Test content",
        status: "published",
        publishedAt: customDate.toISOString(),
      });
      
      const postId = createResult.id;
      
      // Update title only
      await caller.cms.updatePost({
        id: postId,
        title: "Updated Title",
      });
      
      // Fetch the post to verify publishedAt was preserved
      const post = await caller.cms.getPost({ id: postId });
      expect(post).toBeDefined();
      expect(post.title).toBe("Updated Title");
      expect(post.publishedAt).toBeDefined();
      
      const savedDate = new Date(post.publishedAt);
      expect(savedDate.getTime()).toBe(customDate.getTime());
    });
  });
});
