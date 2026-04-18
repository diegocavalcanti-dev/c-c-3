import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getAllCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "Matérias", slug: "materias", description: null, createdAt: new Date() },
    { id: 2, name: "Notícias", slug: "noticias", description: null, createdAt: new Date() },
  ]),
  getCategoryBySlug: vi.fn().mockImplementation(async (slug: string) => {
    if (slug === "materias") return { id: 1, name: "Matérias", slug: "materias", description: null, createdAt: new Date() };
    return undefined;
  }),
  getPublishedPosts: vi.fn().mockResolvedValue({
    posts: [
      {
        id: 1, wpId: 100, title: "Test Post", slug: "test-post",
        content: "<p>Content</p>", excerpt: "Excerpt", featuredImage: null,
        author: "Cenas de Combate", status: "published",
        publishedAt: new Date(), viewCount: 0, createdAt: new Date(), updatedAt: new Date(),
      },
    ],
    total: 1,
  }),
  getPostBySlug: vi.fn().mockImplementation(async (slug: string) => {
    if (slug === "test-post") {
      return {
        id: 1, wpId: 100, title: "Test Post", slug: "test-post",
        content: "<p>Content</p>", excerpt: "Excerpt", featuredImage: null,
        author: "Cenas de Combate", status: "published",
        publishedAt: new Date(), viewCount: 5, createdAt: new Date(), updatedAt: new Date(),
      };
    }
    return undefined;
  }),
  getPostById: vi.fn().mockResolvedValue(null),
  getPostCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "Matérias", slug: "materias", description: null, createdAt: new Date() },
  ]),
  incrementViewCount: vi.fn().mockResolvedValue(undefined),
  createPost: vi.fn().mockResolvedValue(42),
  updatePost: vi.fn().mockResolvedValue(undefined),
  deletePost: vi.fn().mockResolvedValue(undefined),
  getAllPostsAdmin: vi.fn().mockResolvedValue({ posts: [], total: 0 }),
  getPostStats: vi.fn().mockResolvedValue({ total: 322, published: 322, draft: 0 }),
  createCategory: vi.fn().mockResolvedValue(undefined),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  bulkInsertCategories: vi.fn().mockResolvedValue(undefined),
  bulkInsertPosts: vi.fn().mockResolvedValue(10),
  createMedia: vi.fn().mockResolvedValue(1),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test.jpg", key: "test.jpg" }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1, openId: "admin-user", email: "admin@test.com", name: "Admin",
      loginMethod: "manus", role: "admin", createdAt: new Date(),
      updatedAt: new Date(), lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

describe("categories.list", () => {
  it("returns all categories for public users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.categories.list();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Matérias");
  });
});

describe("categories.getBySlug", () => {
  it("returns category by slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.categories.getBySlug({ slug: "materias" });
    expect(result.name).toBe("Matérias");
  });

  it("throws NOT_FOUND for unknown slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.categories.getBySlug({ slug: "unknown" })).rejects.toThrow();
  });
});

describe("posts.list", () => {
  it("returns paginated posts", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.posts.list({ page: 1, limit: 20 });
    expect(result.total).toBe(1);
    expect(result.posts[0].title).toBe("Test Post");
  });
});

describe("posts.getBySlug", () => {
  it("returns post with categories", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.posts.getBySlug({ slug: "test-post" });
    expect(result.title).toBe("Test Post");
    expect(result.categories).toHaveLength(1);
  });

  it("throws NOT_FOUND for unknown slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.posts.getBySlug({ slug: "nonexistent" })).rejects.toThrow();
  });
});

describe("cms.stats (admin only)", () => {
  it("returns stats for admin users", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.cms.stats();
    expect(result.total).toBe(322);
    expect(result.published).toBe(322);
  });

  it("throws FORBIDDEN for non-admin users", async () => {
    const ctx = createPublicContext();
    ctx.user = {
      id: 2, openId: "regular-user", email: "user@test.com", name: "User",
      loginMethod: "manus", role: "user", createdAt: new Date(),
      updatedAt: new Date(), lastSignedIn: new Date(),
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.cms.stats()).rejects.toThrow("Acesso restrito a administradores");
  });
});

describe("cms.createPost (admin only)", () => {
  it("creates a post and returns id", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.cms.createPost({
      title: "New Post",
      slug: "new-post",
      content: "<p>Content</p>",
      status: "draft",
      categoryIds: [],
    });
    expect(result.id).toBe(42);
  });
});
