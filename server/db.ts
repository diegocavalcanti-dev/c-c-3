import { and, desc, eq, like, or, sql, inArray, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, posts, categories, postCategories, media, InsertPost, InsertCategory, InsertMedia } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true,
        },
      });

      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
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
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(categories).values(data);
  return result;
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(categories).where(eq(categories.id, id));
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function getPublishedPosts(opts: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };

  const { page = 1, limit = 20, categorySlug, search } = opts;
  const offset = (page - 1) * limit;

  const conditions = [eq(posts.status, 'published')];

  if (search) {
    conditions.push(
      or(
        like(posts.title, `%${search}%`),
        like(posts.content, `%${search}%`)
      )!
    );
  }

  if (categorySlug) {
    const cat = await getCategoryBySlug(categorySlug);
    if (!cat) return { posts: [], total: 0 };

    const postIds = await db
      .select({ postId: postCategories.postId })
      .from(postCategories)
      .where(eq(postCategories.categoryId, cat.id));

    if (postIds.length === 0) return { posts: [], total: 0 };

    conditions.push(inArray(posts.id, postIds.map(p => p.postId)));
  }

  const whereClause = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db.select().from(posts).where(whereClause).orderBy(desc(posts.publishedAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(posts).where(whereClause),
  ]);

  return { posts: rows, total: countResult[0]?.count ?? 0 };
}

export async function getPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  return result[0];
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result[0];
}

export async function getPostCategories(postId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ category: categories })
    .from(postCategories)
    .innerJoin(categories, eq(postCategories.categoryId, categories.id))
    .where(eq(postCategories.postId, postId));
  return result.map(r => r.category);
}

export async function incrementViewCount(postId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(posts).set({ viewCount: sql`${posts.viewCount} + 1` }).where(eq(posts.id, postId));
}

export async function createPost(data: InsertPost, categoryIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(posts).values(data);
  const insertId = (result as any)[0]?.insertId;
  if (insertId && categoryIds.length > 0) {
    await db.insert(postCategories).values(categoryIds.map(cid => ({ postId: insertId, categoryId: cid })));
  }
  return insertId;
}

export async function updatePost(id: number, data: Partial<InsertPost>, categoryIds?: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(posts).set(data).where(eq(posts.id, id));
  if (categoryIds !== undefined) {
    await db.delete(postCategories).where(eq(postCategories.postId, id));
    if (categoryIds.length > 0) {
      await db.insert(postCategories).values(categoryIds.map(cid => ({ postId: id, categoryId: cid })));
    }
  }
}

export async function deletePost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(postCategories).where(eq(postCategories.postId, id));
  await db.delete(posts).where(eq(posts.id, id));
}

export async function getAllPostsAdmin(opts: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };

  const { page = 1, limit = 20, status, search } = opts;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (status) conditions.push(eq(posts.status, status as any));
  if (search) conditions.push(or(like(posts.title, `%${search}%`), like(posts.excerpt, `%${search}%`)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db.select().from(posts).where(whereClause).orderBy(desc(posts.updatedAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(posts).where(whereClause),
  ]);

  return { posts: rows, total: countResult[0]?.count ?? 0 };
}

export async function getPostStats() {
  const db = await getDb();
  if (!db) return { total: 0, published: 0, draft: 0 };
  const result = await db.select({ status: posts.status, count: count() }).from(posts).groupBy(posts.status);
  const stats = { total: 0, published: 0, draft: 0 };
  for (const row of result) {
    stats.total += row.count;
    if (row.status === 'published') stats.published = row.count;
    if (row.status === 'draft') stats.draft = row.count;
  }
  return stats;
}

// ─── Media ───────────────────────────────────────────────────────────────────

export async function createMedia(data: InsertMedia) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(media).values(data);
  return (result as any)[0]?.insertId;
}

export async function getMediaByWpUrl(wpUrl: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(media).where(eq(media.wpUrl, wpUrl)).limit(1);
  return result[0];
}

export async function getAllMedia() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(media).orderBy(desc(media.createdAt));
}

export async function deleteMedia(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(media).where(eq(media.id, id));
}

// ─── Bulk Import ─────────────────────────────────────────────────────────────

export async function bulkInsertCategories(cats: InsertCategory[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  for (const cat of cats) {
    try {
      await db.insert(categories).values(cat).onDuplicateKeyUpdate({ set: { name: cat.name } });
    } catch (e) {
      // ignore duplicate
    }
  }
}

export async function bulkInsertPosts(postsData: Array<InsertPost & { categoryIds: number[] }>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  let inserted = 0;
  for (const { categoryIds, ...postData } of postsData) {
    try {
      const result = await db.insert(posts).values(postData).onDuplicateKeyUpdate({
        set: { title: postData.title, content: postData.content, updatedAt: new Date() }
      });
      const insertId = (result as any)[0]?.insertId;
      if (insertId && categoryIds.length > 0) {
        // Delete existing and re-insert
        await db.delete(postCategories).where(eq(postCategories.postId, insertId));
        await db.insert(postCategories).values(categoryIds.map(cid => ({ postId: insertId, categoryId: cid })));
      }
      inserted++;
    } catch (e: any) {
      console.error(`Failed to insert post "${postData.title}":`, e.message);
    }
  }
  return inserted;
}
