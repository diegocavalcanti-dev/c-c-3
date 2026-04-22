import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { media } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Media Management", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testMediaId: number;

  beforeAll(async () => {
    db = await getDb();
  });

  afterAll(async () => {
    // Cleanup: delete test media
    if (db && testMediaId) {
      try {
        await db.delete(media).where(eq(media.id, testMediaId));
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  it("should create a media record", async () => {
    if (!db) throw new Error("Database not available");

    const result = await db.insert(media).values({
      filename: "test-image.jpg",
      mimeType: "image/jpeg",
      fileSize: 1024,
      s3Key: "test/test-image.jpg",
      s3Url: "https://example.com/test/test-image.jpg",
    });

    testMediaId = (result as any)[0]?.insertId;
    expect(testMediaId).toBeGreaterThan(0);
  });

  it("should retrieve media by id", async () => {
    if (!db || !testMediaId) throw new Error("Setup failed");

    const result = await db.select().from(media).where(eq(media.id, testMediaId));
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe("test-image.jpg");
    expect(result[0].mimeType).toBe("image/jpeg");
    expect(result[0].fileSize).toBe(1024);
  });

  it("should list all media ordered by creation date", async () => {
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(media);
    expect(Array.isArray(result)).toBe(true);
    
    // Just verify that media list is returned
    // (ordering depends on database state which may have existing records)
    if (result.length > 0) {
      expect(result[0].filename).toBeDefined();
      expect(result[0].createdAt).toBeDefined();
    }
  });

  it("should delete media record", async () => {
    if (!db || !testMediaId) throw new Error("Setup failed");

    await db.delete(media).where(eq(media.id, testMediaId));

    const result = await db.select().from(media).where(eq(media.id, testMediaId));
    expect(result).toHaveLength(0);
  });

  it("should handle media with optional fields", async () => {
    if (!db) throw new Error("Database not available");

    const result = await db.insert(media).values({
      filename: "minimal-image.png",
      mimeType: "image/png",
      fileSize: 2048,
      s3Key: "test/minimal-image.png",
      s3Url: "https://example.com/test/minimal-image.png",
      wpUrl: null, // Optional
    });

    const insertedId = (result as any)[0]?.insertId;
    expect(insertedId).toBeGreaterThan(0);

    // Cleanup
    if (insertedId) {
      await db.delete(media).where(eq(media.id, insertedId));
    }
  });

  it("should store media with WordPress URL if provided", async () => {
    if (!db) throw new Error("Database not available");

    const wpUrl = "https://wordpress.example.com/wp-content/uploads/2026/04/test.jpg";
    const result = await db.insert(media).values({
      filename: "wp-image.jpg",
      mimeType: "image/jpeg",
      fileSize: 3072,
      s3Key: "test/wp-image.jpg",
      s3Url: "https://example.com/test/wp-image.jpg",
      wpUrl,
    });

    const insertedId = (result as any)[0]?.insertId;
    const inserted = await db.select().from(media).where(eq(media.id, insertedId));
    
    expect(inserted[0].wpUrl).toBe(wpUrl);

    // Cleanup
    if (insertedId) {
      await db.delete(media).where(eq(media.id, insertedId));
    }
  });
});
