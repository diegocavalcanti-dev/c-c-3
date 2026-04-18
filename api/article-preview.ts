export const runtime = "nodejs";

type PostMeta = {
  title: string;
  description: string;
  image?: string | null;
  url: string;
  slug: string;
  author?: string | null;
  publishedAt?: string | null;
  category?: string | null;
  contentHtml?: string | null;
};

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(date?: string | null) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    });
  } catch {
    return "";
  }
}

function notFoundHtml() {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Artigo não encontrado | Cenas de Combate</title>
    <meta name="robots" content="noindex, nofollow" />
    <style>
      body { font-family: Inter, Arial, sans-serif; padding: 40px; background: #0f172a; color: #fff; }
      a { color: #93c5fd; }
    </style>
  </head>
  <body>
    <h1>Artigo não encontrado</h1>
    <p>O link pode estar incorreto ou o artigo não está mais publicado.</p>
    <p><a href="https://cenasdecombate.com/">Voltar ao início</a></p>
  </body>
</html>`;
}

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const slug = reqUrl.searchParams.get("slug");

  if (!slug) {
    return new Response("missing slug", { status: 400 });
  }

  const siteUrl = process.env.SITE_URL || "https://cenasdecombate.com";
  const backendBase =
    process.env.METADATA_API_BASE_URL ||
    process.env.VITE_API_URL ||
    "https://combateapi-7di34rx2.manus.space";

  const metaUrl = `${backendBase.replace(/\/$/, "")}/api/public/post-meta/${encodeURIComponent(slug)}`;

  let post: PostMeta | null = null;

  try {
    const res = await fetch(metaUrl, {
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      return new Response(notFoundHtml(), {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    post = (await res.json()) as PostMeta;
  } catch (error) {
    console.error("[article-preview] fetch failed:", error);
    return new Response("preview fetch failed", { status: 500 });
  }

  const title = post.title || "Cenas de Combate";
  const description =
    post.description ||
    "Portal de história militar, conflitos mundiais e geopolítica.";
  const canonical = post.url || `${siteUrl}/${slug}`;
  const image = post.image || `${siteUrl}/og-default.jpg`;
  const publishedDate = formatDate(post.publishedAt);

  const html = `<!doctype html>
<html lang="pt-BR" prefix="og: https://ogp.me/ns#">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <title>${escapeHtml(title)} | Cenas de Combate</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />

    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:site_name" content="Cenas de Combate" />
    <meta property="og:locale" content="pt_BR" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />

    ${post.publishedAt ? `<meta property="article:published_time" content="${escapeHtml(post.publishedAt)}" />` : ""}
    ${post.author ? `<meta property="article:author" content="${escapeHtml(post.author)}" />` : ""}

    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        font-family: Inter, Arial, sans-serif;
        background: #0b1020;
        color: #e5e7eb;
      }
      .wrap {
        max-width: 860px;
        margin: 0 auto;
        padding: 24px 20px 64px;
      }
      a {
        color: #93c5fd;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      .back {
        display: inline-block;
        margin-bottom: 20px;
        font-size: 14px;
      }
      .category {
        display: inline-block;
        margin-bottom: 14px;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(59, 130, 246, 0.15);
        color: #93c5fd;
        font-size: 12px;
      }
      h1 {
        font-size: 2rem;
        line-height: 1.15;
        margin: 0 0 12px;
      }
      .meta {
        color: #94a3b8;
        font-size: 14px;
        margin-bottom: 24px;
      }
      .hero {
        width: 100%;
        border-radius: 16px;
        margin: 0 0 24px;
        display: block;
      }
      .excerpt {
        font-size: 1.05rem;
        color: #cbd5e1;
        margin: 0 0 24px;
      }
      .article {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 18px;
        padding: 24px;
      }
      .article img {
        max-width: 100%;
        height: auto;
      }
      .article iframe {
        max-width: 100%;
      }
      .footer {
        margin-top: 28px;
        font-size: 14px;
        color: #94a3b8;
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <a class="back" href="/">← Voltar ao início</a>

      ${post.category ? `<div class="category">${escapeHtml(post.category)}</div>` : ""}
      <h1>${escapeHtml(title)}</h1>

      <div class="meta">
        ${publishedDate ? escapeHtml(publishedDate) : ""}
        ${post.author ? `${publishedDate ? " • " : ""}${escapeHtml(post.author)}` : ""}
      </div>

      ${image ? `<img class="hero" src="${escapeHtml(image)}" alt="${escapeHtml(title)}" />` : ""}
      <p class="excerpt">${escapeHtml(description)}</p>

      <article class="article">
        ${post.contentHtml || ""}
      </article>

      <div class="footer">
        <a href="${escapeHtml(canonical)}">Link permanente</a>
      </div>
    </main>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}