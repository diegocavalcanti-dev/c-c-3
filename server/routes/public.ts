import { Router, Request, Response } from "express";
import { getPostBySlug, incrementPostViewCount } from "../db";

const router = Router();

/**
 * GET /api/pub/post-meta/:slug
 * Returns post metadata for social media preview (Open Graph)
 */
router.get("/post-meta/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const post = await getPostBySlug(slug);

    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    // Increment view count
    await incrementPostViewCount(post.id);

    // Return metadata in JSON format
    const metadata = {
      title: post.title,
      description: post.excerpt || post.content.substring(0, 160),
      image: post.featuredImage || null,
      url: `${process.env.SITE_URL}/posts/${post.slug}`,
      slug: post.slug,
      author: post.author || null,
      publishedAt: post.publishedAt?.toISOString() || null,
      category: null,
      contentHtml: post.content || null,
    };

    res.setHeader("Content-Type", "application/json");
    res.json(metadata);
  } catch (error) {
    console.error("[API] Error fetching post metadata:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default router;
