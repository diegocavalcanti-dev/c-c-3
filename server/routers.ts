import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getPublishedPosts,
  getPostBySlug,
  getAllCategories,
  getCategoriesForPost,
  incrementPostViewCount,
} from "./db";
import { getDb } from "./db";
import { posts, categories, postCategories, InsertPost, InsertCategory } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  posts: router({
    list: publicProcedure
      .input(
        z.object({
          page: z.number().int().positive().default(1),
          limit: z.number().int().positive().max(100).default(10),
          categoryId: z.number().int().positive().optional(),
          search: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const { posts, total } = await getPublishedPosts({
          page: input.page,
          limit: input.limit,
          categoryId: input.categoryId,
          search: input.search,
        });
        return {
          posts,
          total,
          page: input.page,
          limit: input.limit,
          pages: Math.ceil(total / input.limit),
        };
      }),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const post = await getPostBySlug(input.slug);
        if (!post) return null;
        const categories = await getCategoriesForPost(post.id);
        // Increment view count
        await incrementPostViewCount(post.id);
        return { ...post, categories };
      }),

    // Admin: Create post
    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          slug: z.string().min(1),
          content: z.string().min(1),
          excerpt: z.string().optional(),
          featuredImage: z.string().optional(),
          status: z.enum(["draft", "published", "archived"]).default("draft"),
          author: z.string().optional(),
          categoryIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        try {
          const result = await db.insert(posts).values({
            title: input.title,
            slug: input.slug,
            content: input.content,
            excerpt: input.excerpt,
            featuredImage: input.featuredImage,
            status: input.status,
            author: input.author,
            publishedAt: input.status === "published" ? new Date() : null,
          });

          const postId = (result as any).insertId;

          // Associate categories
          if (input.categoryIds && input.categoryIds.length > 0) {
            for (const categoryId of input.categoryIds) {
              await db.insert(postCategories).values({
                postId,
                categoryId,
              });
            }
          }

          return { id: postId, ...input };
        } catch (error) {
          console.error("Error creating post:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    // Admin: Update post
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
          content: z.string().min(1).optional(),
          excerpt: z.string().optional(),
          featuredImage: z.string().optional(),
          status: z.enum(["draft", "published", "archived"]).optional(),
          author: z.string().optional(),
          categoryIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        try {
          const { id, categoryIds, ...updateData } = input;

          // Update post
          await db.update(posts).set({
            ...updateData,
            publishedAt:
              updateData.status === "published"
                ? new Date()
                : updateData.status === "draft"
                  ? null
                  : undefined,
          }).where(eq(posts.id, id));

          // Update categories if provided
          if (categoryIds) {
            await db.delete(postCategories).where(eq(postCategories.postId, id));
            for (const categoryId of categoryIds) {
              await db.insert(postCategories).values({
                postId: id,
                categoryId,
              });
            }
          }

          return { id: input.id, title: input.title, slug: input.slug, content: input.content, excerpt: input.excerpt, featuredImage: input.featuredImage, status: input.status, author: input.author, categoryIds: input.categoryIds };
        } catch (error) {
          console.error("Error updating post:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    // Admin: Delete post
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        try {
          await db.delete(postCategories).where(eq(postCategories.postId, input.id));
          await db.delete(posts).where(eq(posts.id, input.id));
          return { success: true };
        } catch (error) {
          console.error("Error deleting post:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    // Admin: List all posts (including drafts)
    adminList: adminProcedure
      .input(
        z.object({
          page: z.number().int().positive().default(1),
          limit: z.number().int().positive().max(100).default(10),
          status: z.enum(["draft", "published", "archived"]).optional(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { posts: [], total: 0 };

        const page = input.page || 1;
        const limit = input.limit || 10;
        const offset = (page - 1) * limit;

        const whereCondition = input.status ? eq(posts.status, input.status) : undefined;

        const countResult = await db
          .select({ count: posts.id })
          .from(posts)
          .where(whereCondition);

        const total = countResult.length;

        const result = await db
          .select()
          .from(posts)
          .where(whereCondition)
          .orderBy(posts.createdAt)
          .limit(limit)
          .offset(offset);

        return { posts: result, total, page, limit, pages: Math.ceil(total / limit) };
      }),
  }),

  categories: router({
    list: publicProcedure.query(async () => {
      return await getAllCategories();
    }),

    // Admin: Create category
    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        try {
          const result = await db.insert(categories).values({
            name: input.name,
            slug: input.slug,
            description: input.description,
          });

          const categoryId = (result as any).insertId;
          return { id: categoryId, name: input.name, slug: input.slug, description: input.description };
        } catch (error) {
          console.error("Error creating category:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    // Admin: Update category
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        try {
          const { id, ...updateData } = input;
          await db.update(categories).set(updateData).where(eq(categories.id, id));
          return { id: input.id, name: input.name, slug: input.slug, description: input.description };
        } catch (error) {
          console.error("Error updating category:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    // Admin: Delete category
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        try {
          await db.delete(postCategories).where(eq(postCategories.categoryId, input.id));
          await db.delete(categories).where(eq(categories.id, input.id));
          return { success: true };
        } catch (error) {
          console.error("Error deleting category:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
