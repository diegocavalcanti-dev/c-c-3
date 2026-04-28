import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import {
  getAllAuthors,
  getAuthorBySlug,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  getAuthorPosts,
} from "./db";

describe("Authors Database Functions", () => {
  let testAuthorId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available for tests");
    }
  });

  it("should create an author", async () => {
    const id = await createAuthor({
      name: "Test Author",
      slug: "test-author",
      bio: "This is a test author",
      avatar: "https://example.com/avatar.jpg",
    });
    expect(id).toBeDefined();
    expect(typeof id).toBe("number");
    testAuthorId = id;
  });

  it("should get author by slug", async () => {
    const author = await getAuthorBySlug("test-author");
    expect(author).toBeDefined();
    expect(author?.name).toBe("Test Author");
    expect(author?.slug).toBe("test-author");
  });

  it("should get author by id", async () => {
    const author = await getAuthorById(testAuthorId);
    expect(author).toBeDefined();
    expect(author?.id).toBe(testAuthorId);
    expect(author?.name).toBe("Test Author");
  });

  it("should get all authors", async () => {
    const authors = await getAllAuthors();
    expect(Array.isArray(authors)).toBe(true);
    expect(authors.length).toBeGreaterThan(0);
  });

  it("should update an author", async () => {
    await updateAuthor(testAuthorId, {
      bio: "Updated bio",
    });
    const author = await getAuthorById(testAuthorId);
    expect(author?.bio).toBe("Updated bio");
  });

  it("should get author posts (empty initially)", async () => {
    const result = await getAuthorPosts(testAuthorId);
    expect(result).toBeDefined();
    expect(result.posts).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("should delete an author", async () => {
    await deleteAuthor(testAuthorId);
    const author = await getAuthorById(testAuthorId);
    expect(author).toBeUndefined();
  });

  afterAll(async () => {
    // Cleanup if needed
  });
});
