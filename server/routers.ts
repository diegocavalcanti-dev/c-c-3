import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { submitToIndexNow } from "./_core/indexnow";
import {
  getAllPostsAdmin, getPostStats,
  bulkInsertCategories, bulkInsertPosts, createMedia, getAllMedia, deleteMedia as deleteMediaDb,
  getAllAuthors, getAuthorBySlug, getAuthorById, createAuthor, updateAuthor, deleteAuthor, getAuthorPosts,
  updatePost, deletePost, getAllCategories, getPostById, getPostCategories, createPost,
  getPostBySlug, incrementViewCount, getPublishedPosts,
  getCategoryBySlug, createCategory, updateCategory, deleteCategory,
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

  // ─── Authors ───────────────────────────────────────────────────────────────

  authors: router({
    list: publicProcedure.query(async () => {
      return getAllAuthors();
    }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const author = await getAuthorBySlug(input.slug);
        if (!author) throw new TRPCError({ code: 'NOT_FOUND' });
        return author;
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const author = await getAuthorById(input.id);
        if (!author) throw new TRPCError({ code: 'NOT_FOUND' });
        return author;
      }),

    getPosts: publicProcedure
      .input(z.object({ authorId: z.number(), page: z.number().default(1), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const offset = (input.page - 1) * input.limit;
        return getAuthorPosts(input.authorId, { limit: input.limit, offset });
      }),

    create: adminProcedure
      .input(z.object({ name: z.string().min(1), slug: z.string().min(1), bio: z.string().optional(), avatar: z.string().optional() }))
      .mutation(async ({ input }) => {
        const id = await createAuthor(input);
        return { success: true, id };
      }),

    update: adminProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), slug: z.string().optional(), bio: z.string().optional(), avatar: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateAuthor(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAuthor(input.id);
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
        authorId: z.number().nullable().optional(),
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
          void submitToIndexNow([
            `/${postData.slug}`,
            "/",
          ]);

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
        authorId: z.number().nullable().optional(),
        categoryIds: z.array(z.number()).optional(),
        publishedAt: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { id, categoryIds, publishedAt, ...postData } = input;

        const existing = await getPostById(id);
        const wasPublished = existing?.status === 'published';

        const willBePublished = (postData.status ?? existing?.status) === 'published';

        const updateData: any = { ...postData };
        if (publishedAt !== undefined) {
          updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
        }
        if (willBePublished && !wasPublished && !updateData.publishedAt) {
          updateData.publishedAt = new Date();
        }

        await updatePost(id, updateData, categoryIds);

        if (willBePublished) {
          const urlsToSubmit = new Set<string>();

          const finalSlug = postData.slug || existing?.slug;

          if (finalSlug) {
            urlsToSubmit.add(`/${finalSlug}`);
          }

          if (existing?.slug && postData.slug && existing.slug !== postData.slug) {
            urlsToSubmit.add(`/${existing.slug}`);
          }

          urlsToSubmit.add("/");

          void submitToIndexNow(Array.from(urlsToSubmit));
        }

        if (willBePublished && !wasPublished) {
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
        const existing = await getPostById(input.id);

        await deletePost(input.id);

        if (existing?.status === 'published' && existing.slug) {
          void submitToIndexNow([
            `/${existing.slug}`,
            "/",
          ]);
        }

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
