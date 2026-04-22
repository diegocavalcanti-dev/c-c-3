import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { posts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * GET /sitemap.xml
 * Generates dynamic XML sitemap for all published posts
 */
router.get("/sitemap.xml", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    // Get all published posts
    const publishedPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(posts.publishedAt);

    const siteUrl = process.env.SITE_URL || "https://www.cenasdecombate.com";

    // Build XML sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add home page
    xml += '  <url>\n';
    xml += `    <loc>${siteUrl}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Add all published posts
    for (const post of publishedPosts) {
      xml += '  <url>\n';
      xml += `    <loc>${siteUrl}/posts/${post.slug}</loc>\n`;
      if (post.updatedAt) {
        xml += `    <lastmod>${post.updatedAt.toISOString().split("T")[0]}</lastmod>\n`;
      }
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (error) {
    console.error("[Sitemap] Error generating sitemap:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
