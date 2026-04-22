import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import {
  getAllCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory,
  getPublishedPosts, getPostBySlug, getPostById, getPostCategories, incrementViewCount,
  createPost, updatePost, deletePost, getAllPostsAdmin, getPostStats,
  bulkInsertCategories, bulkInsertPosts, createMedia, getAllMedia, deleteMedia as deleteMediaDb,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores' });
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
      return { success: true } as const;
    }),
  }),

  // ─── Categories ────────────────────────────────────────────────────────────

  categories: router({
    list: publicProcedure.query(async () => {
      return getAllCategories();
    }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const cat = await getCategoryBySlug(input.slug);
        if (!cat) throw new TRPCError({ code: 'NOT_FOUND' });
        return cat;
      }),

    create: adminProcedure
      .input(z.object({ name: z.string().min(1), slug: z.string().min(1), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        await createCategory(input);
        return { success: true };
      }),

    update: adminProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), slug: z.string().optional(), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCategory(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCategory(input.id);
        return { success: true };
      }),
  }),

  // ─── Posts (Public) ────────────────────────────────────────────────────────

  posts: router({
    list: publicProcedure
      .input(z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        categorySlug: z.string().optional(),
        search: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return getPublishedPosts(input);
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const post = await getPostBySlug(input.slug);
        if (!post || post.status !== 'published') throw new TRPCError({ code: 'NOT_FOUND' });
        const postCats = await getPostCategories(post.id);
        await incrementViewCount(post.id);
        return { ...post, categories: postCats };
      }),

    getFeatured: publicProcedure.query(async () => {
      const result = await getPublishedPosts({ page: 1, limit: 6 });
      return result.posts;
    }),

    getLatest: publicProcedure
      .input(z.object({ limit: z.number().default(12) }))
      .query(async ({ input }) => {
        const result = await getPublishedPosts({ page: 1, limit: input.limit });
        return result.posts;
      }),
  }),

  // ─── CMS (Admin) ───────────────────────────────────────────────────────────

  cms: router({
    stats: adminProcedure.query(async () => {
      const [stats, cats] = await Promise.all([getPostStats(), getAllCategories()]);
      return { ...stats, categories: cats.length };
    }),

    listPosts: adminProcedure
      .input(z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        status: z.string().optional(),
        search: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return getAllPostsAdmin(input);
      }),

    getPost: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const post = await getPostById(input.id);
        if (!post) throw new TRPCError({ code: 'NOT_FOUND' });
        const cats = await getPostCategories(post.id);
        return { ...post, categories: cats };
      }),

    createPost: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        content: z.string(),
        excerpt: z.string().optional(),
        featuredImage: z.string().optional(),
        status: z.enum(['draft', 'published', 'archived']).default('draft'),
        author: z.string().optional(),
        categoryIds: z.array(z.number()).default([]),
        publishedAt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { categoryIds, publishedAt, ...postData } = input;
        const insertData = {
          ...postData,
          publishedAt: publishedAt ? new Date(publishedAt) : (postData.status === 'published' ? new Date() : undefined),
        };
        const id = await createPost(insertData, categoryIds);

        if (postData.status === 'published') {
          try {
            await notifyOwner({
              title: `Novo artigo publicado: ${postData.title}`,
              content: `Um novo artigo foi publicado no Cenas de Combate.\n\nTítulo: ${postData.title}\nAutor: ${postData.author || 'Cenas de Combate'}`,
            });
          } catch (e) {
            console.error('Failed to notify owner:', e);
          }
        }

        return { id };
      }),

    updatePost: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        slug: z.string().optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        featuredImage: z.string().optional().nullable(),
        status: z.enum(['draft', 'published', 'archived']).optional(),
        author: z.string().optional(),
        categoryIds: z.array(z.number()).optional(),
        publishedAt: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { id, categoryIds, publishedAt, ...postData } = input;

        const existing = await getPostById(id);
        const wasPublished = existing?.status === 'published';
        const isNowPublished = postData.status === 'published';

        const updateData: any = { ...postData };
        if (publishedAt !== undefined) {
          updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
        }
        if (isNowPublished && !wasPublished && !updateData.publishedAt) {
          updateData.publishedAt = new Date();
        }

        await updatePost(id, updateData, categoryIds);

        if (isNowPublished && !wasPublished) {
          try {
            await notifyOwner({
              title: `Artigo publicado: ${postData.title || existing?.title}`,
              content: `Um artigo foi publicado no Cenas de Combate.\n\nTítulo: ${postData.title || existing?.title}`,
            });
          } catch (e) {
            console.error('Failed to notify owner:', e);
          }
        }

        return { success: true };
      }),

    deletePost: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePost(input.id);
        return { success: true };
      }),

    uploadImage: adminProcedure
      .input(z.object({
        filename: z.string(),
        contentType: z.string(),
        dataBase64: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { filename, contentType, dataBase64 } = input;
        const buffer = Buffer.from(dataBase64, 'base64');
        const ext = filename.split('.').pop() || 'jpg';
        const key = `cms-uploads/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, contentType);
        await createMedia({ s3Key: key, s3Url: url, filename, mimeType: contentType, fileSize: buffer.length });
        return { url };
      }),

    listMedia: adminProcedure.query(async () => {
      const mediaList = await getAllMedia();
      return mediaList.map(m => ({
        id: m.id,
        url: m.s3Url || "",
        filename: m.filename || "",
        size: m.fileSize || 0,
        createdAt: m.createdAt,
      }));
    }),

    deleteMedia: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteMediaDb(input.id);
        return { success: true };
      }),

    // Bulk import from WordPress data
    importWordPress: adminProcedure
      .input(z.object({
        categories: z.array(z.object({ name: z.string(), slug: z.string(), description: z.string().optional() })),
        posts: z.array(z.object({
          wpId: z.number().optional().nullable(),
          title: z.string(),
          slug: z.string(),
          content: z.string(),
          excerpt: z.string().optional(),
          featuredImage: z.string().optional().nullable(),
          author: z.string().optional(),
          publishedAt: z.string().optional().nullable(),
          categories: z.array(z.string()),
        })),
      }))
      .mutation(async ({ input }) => {
        // Insert categories
        await bulkInsertCategories(input.categories);

        // Get category map
        const allCats = await getAllCategories();
        const catSlugToId = new Map(allCats.map(c => [c.slug, c.id]));

        // Prepare posts
        const postsToInsert = input.posts.map(p => ({
          wpId: p.wpId ?? undefined,
          title: p.title,
          slug: p.slug,
          content: p.content,
          excerpt: p.excerpt || '',
          featuredImage: p.featuredImage || null,
          author: p.author || 'Cenas de Combate',
          status: 'published' as const,
          publishedAt: p.publishedAt ? new Date(p.publishedAt) : new Date(),
          categoryIds: p.categories.map(s => catSlugToId.get(s)).filter(Boolean) as number[],
        }));

        const inserted = await bulkInsertPosts(postsToInsert);
        return { inserted, total: input.posts.length };
      }),
  }),
});

export type AppRouter = typeof appRouter;
