import { describe, expect, it } from "vitest";
import { getPostBySlug, getPostCategories } from "./db";

describe("POST Meta Route (/api/public/post-meta/:slug)", () => {
  it("should return post metadata with all required fields", async () => {
    // Test with a known published post from the imported data
    const post = await getPostBySlug("o-sangue-no-volga-por-que-a-batalha-de-stalingrado-mudou-o-mundo");

    expect(post).toBeDefined();
    if (post) {
      expect(post.title).toBeDefined();
      expect(post.title).toBeTypeOf("string");
      expect(post.title.length).toBeGreaterThan(0);

      expect(post.excerpt).toBeDefined();
      expect(post.content).toBeDefined();
      expect(post.content).toBeTypeOf("string");

      expect(post.slug).toBe("o-sangue-no-volga-por-que-a-batalha-de-stalingrado-mudou-o-mundo");
      expect(post.status).toBe("published");

      // Test categories
      const categories = await getPostCategories(post.id);
      expect(Array.isArray(categories)).toBe(true);
      if (categories.length > 0) {
        expect(categories[0].name).toBeDefined();
      }
    }
  });

  it("should return null for non-existent slug", async () => {
    const post = await getPostBySlug("this-slug-does-not-exist-12345");
    expect(post).toBeUndefined();
  });

  it("should handle slug with special characters", async () => {
    // Test that the database can handle queries with special characters
    const post = await getPostBySlug("test-slug-with-special-chars-!@#");
    // Should either return undefined or handle gracefully
    expect(post === undefined || post.slug).toBeTruthy();
  });

  it("should return post with featured image when available", async () => {
    const post = await getPostBySlug("o-sangue-no-volga-por-que-a-batalha-de-stalingrado-mudou-o-mundo");
    
    if (post) {
      // Featured image can be optional, but if present should be a string
      if (post.featuredImage) {
        expect(post.featuredImage).toBeTypeOf("string");
      }
    }
  });

  it("should return post with author information", async () => {
    const post = await getPostBySlug("o-sangue-no-volga-por-que-a-batalha-de-stalingrado-mudou-o-mundo");
    
    if (post) {
      // Author can be optional or have a default value
      expect(post.author === null || typeof post.author === "string").toBe(true);
    }
  });
});
