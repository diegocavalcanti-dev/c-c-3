import { eq, desc, and, inArray, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, posts, categories, postCategories, media, settings } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get published posts with pagination and optional filtering
 */
export async function getPublishedPosts(options: {
  page?: number;
  limit?: number;
  categoryId?: number;
  search?: string;
} = {}) {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };

  const page = options.page || 1;
  const limit = options.limit || 10;
  const offset = (page - 1) * limit;

  let whereConditions: any = eq(posts.status, "published");

  // Build conditions array
  const conditions: any[] = [eq(posts.status, "published")];

  // Add category filter if provided
  if (options.categoryId) {
    const postIds = await db
      .select({ postId: postCategories.postId })
      .from(postCategories)
      .where(eq(postCategories.categoryId, options.categoryId));
    
    const ids = postIds.map(p => p.postId);
    if (ids.length === 0) {
      return { posts: [], total: 0 };
    }
    conditions.push(inArray(posts.id, ids));
  }

  // Add search filter if provided
  if (options.search) {
    conditions.push(like(posts.title, `%${options.search}%`));
  }

  const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(whereCondition);

  const total = countResult[0]?.count || 0;

  // Get paginated results
  const result = await db
    .select()
    .from(posts)
    .where(whereCondition)
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset);

  return { posts: result, total };
}

/**
 * Get a single post by slug
 */
export async function getPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Increment view count for a post
 */
export async function incrementPostViewCount(postId: number) {
  const db = await getDb();
  if (!db) return;

  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (post.length === 0) return;

  await db.update(posts).set({ viewCount: post[0].viewCount + 1 }).where(eq(posts.id, postId));
}

/**
 * Get all categories
 */
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(categories).orderBy(categories.name);
}

/**
 * Get a category by ID
 */
export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Get categories for a post
 */
export async function getCategoriesForPost(postId: number) {
  const db = await getDb();
  if (!db) return [];

  const categoryIds = await db
    .select({ categoryId: postCategories.categoryId })
    .from(postCategories)
    .where(eq(postCategories.postId, postId));

  if (categoryIds.length === 0) return [];

  const ids = categoryIds.map(c => c.categoryId);
  return await db.select().from(categories).where(inArray(categories.id, ids));
}

/**
 * Get posts for a category
 */
export async function getPostsForCategory(categoryId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const postIds = await db
    .select({ postId: postCategories.postId })
    .from(postCategories)
    .where(eq(postCategories.categoryId, categoryId));

  if (postIds.length === 0) return [];

  const ids = postIds.map(p => p.postId);
  return await db
    .select()
    .from(posts)
    .where(and(inArray(posts.id, ids), eq(posts.status, "published")))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}
