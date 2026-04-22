import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getPostBySlug, getPostCategories } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(port, () => {
      server.close(() => resolve(true));
    });

    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No available port found starting from ${startPort}`);
}

const SITE_URL = process.env.SITE_URL || "https://www.cenasdecombate.com";

function stripHtml(html = ""): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function toAbsoluteUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://c-c-1.vercel.app",
    "https://cenasdecombate.vercel.app",
    "https://cenasdecombate.com",
    "https://www.cenasdecombate.com",
    "https://cenascombat-ytdtojuw.manus.space",
    "https://militaryhub-mbzaujlx.manus.space",
    "https://combateapi-7di34rx2.manus.space",
    "https://3000-ib3uzyz70vj9sjpfmw221-0b019396.us2.manus.computer",
    process.env.VITE_FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin(origin, callback) {
        // permite requests sem Origin (curl, bots, server-to-server)
        if (!origin) return callback(null, true);

        // Allow any manus.computer domain in development
        if (origin?.includes('manus.computer') || origin?.includes('localhost')) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`))
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-trpc-source"],
    })
  );

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  // ─── Public API Routes (must be before Vite middleware) ───────────────────────
  app.get("/api/public/post-meta/:slug", async (req, res) => {
    try {
      const slug = String(req.params.slug || "").trim();

      if (!slug) {
        return res.status(400).json({ error: "missing_slug" });
      }

      const post = await getPostBySlug(slug);

      if (!post || post.status !== "published") {
        return res.status(404).json({ error: "not_found" });
      }

      const categories = await getPostCategories(post.id);

      const description = stripHtml(post.excerpt || post.content).slice(0, 180);
      const image =
        toAbsoluteUrl(post.featuredImage) || `${SITE_URL}/og-default.jpg`;

      res.setHeader(
        "Cache-Control",
        "public, s-maxage=600, stale-while-revalidate=86400"
      );
      res.setHeader("Content-Type", "application/json; charset=utf-8");

      return res.json({
        title: post.title,
        description,
        image,
        url: `${SITE_URL}/${post.slug}`,
        slug: post.slug,
        author: post.author || "Cenas de Combate",
        publishedAt:
          post.publishedAt instanceof Date
            ? post.publishedAt.toISOString()
            : post.publishedAt ?? null,
        category: categories[0]?.name || null,
        contentHtml: post.content || "",
      });
    } catch (error) {
      console.error("[post-meta] failed:", error);
      return res.status(500).json({ error: "internal_error" });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // ─── Vite/Static Serving (must be last) ───────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch((error) => {
  console.error("[server] failed to start:", error);
  process.exit(1);
});