export const runtime = "nodejs";

type PostMeta = {
  title: string;
  description: string;
  image?: string | null;
  url?: string | null;
  slug: string;
  author?: string | null;
  publishedAt?: string | null;
  category?: string | null;
  contentHtml?: string | null;
};

const OG_IMAGE_WIDTH = "1200";
const OG_IMAGE_HEIGHT = "630";

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toAbsoluteUrl(url: string | null | undefined, siteUrl: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function fetchAppShell(origin: string) {
  const res = await fetch(`${origin}/`, {
    headers: {
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch app shell: ${res.status}`);
  }

  return res.text();
}

function stripOldSeoTags(html: string) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+name=["']robots["'][^>]*>\s*/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+property=["']article:[^"']+["'][^>]*>\s*/gi, "");
}

function injectSeoTags(html: string, seoBlock: string) {
  const cleaned = stripOldSeoTags(html);

  if (/<\/head>/i.test(cleaned)) {
    return cleaned.replace(/<\/head>/i, `${seoBlock}\n</head>`);
  }

  return `${cleaned}\n${seoBlock}`;
}

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const slug = reqUrl.searchParams.get("slug");

  if (!slug) {
    return new Response("missing slug", { status: 400 });
  }

  const origin = reqUrl.origin;
  const siteUrl = (process.env.SITE_URL || origin).replace(/\/$/, "");
  const backendBase = (
    process.env.METADATA_API_BASE_URL ||
    process.env.VITE_API_URL ||
    "https://combateapi-7di34rx2.manus.space"
  ).replace(/\/$/, "");

  let appShell = "";

  try {
    appShell = await fetchAppShell(origin);
  } catch (error) {
    console.error("[article-preview] app shell fetch failed:", error);
    return new Response("app shell fetch failed", { status: 500 });
  }

  try {
    const metaUrl = `${backendBase}/api/public/post-meta/${encodeURIComponent(slug)}`;

    const res = await fetch(metaUrl, {
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      return new Response(appShell, {
        status: res.status === 404 ? 404 : 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      });
    }

    const post = (await res.json()) as PostMeta;

    const title = post.title || "Cenas de Combate";
    const description =
      post.description ||
      "Portal de história militar, conflitos mundiais e geopolítica.";

    const canonical = toAbsoluteUrl(
      (post.url && post.url.trim()) || `/${slug}`,
      siteUrl
    );

    const image = toAbsoluteUrl(
      (post.image && post.image.trim()) || "/og-default.jpg",
      siteUrl
    );

    const seoBlock = `
<title>${escapeHtml(title)} | Cenas de Combate</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta name="robots" content="max-image-preview:large" />
<link rel="canonical" href="${escapeHtml(canonical)}" />

<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${escapeHtml(canonical)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:secure_url" content="${escapeHtml(image)}" />
<meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />
<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />
<meta property="og:image:alt" content="${escapeHtml(title)}" />
<meta property="og:site_name" content="Cenas de Combate" />
<meta property="og:locale" content="pt_BR" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
<meta name="twitter:url" content="${escapeHtml(canonical)}" />

${
  post.publishedAt
    ? `<meta property="article:published_time" content="${escapeHtml(post.publishedAt)}" />`
    : ""
}
${
  post.author
    ? `<meta property="article:author" content="${escapeHtml(post.author)}" />`
    : ""
}`.trim();

    const html = injectSeoTags(appShell, seoBlock);

    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, s-maxage=600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[article-preview] metadata fetch failed:", error);

    return new Response(appShell, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }
}