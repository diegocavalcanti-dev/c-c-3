import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://www.cenasdecombate.com';

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html = '') {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function generateSitemap() {
  console.log('📝 Gerando sitemap, robots.txt e feed RSS...');

  const distPublicDir = path.join(__dirname, '..', 'dist', 'public');

  if (!fs.existsSync(distPublicDir)) {
    fs.mkdirSync(distPublicDir, { recursive: true });
  }

  try {
    const baseUrl = 'https://combateapi-7di34rx2.manus.space/api/trpc/posts.list';
    const input = encodeURIComponent(
      JSON.stringify({
        '0': {
          json: {
            page: 1,
            limit: 1000,
          },
        },
      })
    );

    const url = `${baseUrl}?batch=1&input=${input}`;

    console.log(`🔗 Buscando posts de: ${baseUrl}`);

    let posts = [];

    try {
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        posts = data[0]?.result?.data?.json?.posts || [];
        console.log(`✅ ${posts.length} posts encontrados`);
      } else {
        console.warn(
          `⚠️ Aviso: Não conseguiu buscar posts. Status ${response.status}. Usando lista vazia.`
        );
      }
    } catch (fetchError) {
      console.warn(
        `⚠️ Aviso ao buscar posts: ${fetchError.message}. Usando lista vazia.`
      );
    }

    const today = new Date().toISOString().split('T')[0];

    const postUrls = posts
      .filter((post) => post?.slug)
      .map((post) => ({
        url: `/${post.slug}`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: post.updatedAt || post.publishedAt || post.createdAt,
      }));

    const staticUrls = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/search', changefreq: 'weekly', priority: 0.6 },
    ];

    const allUrls = [...staticUrls, ...postUrls];

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (item) => `  <url>
    <loc>${SITE_URL}${item.url}</loc>
    <lastmod>${item.lastmod ? new Date(item.lastmod).toISOString().split('T')[0] : today}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    const sitemapPath = path.join(distPublicDir, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');

    console.log(`✅ sitemap.xml gerado!`);
    console.log(`📁 Salvo em: ${sitemapPath}`);

    const feedItems = posts
      .filter((post) => post?.slug)
      .slice(0, 50)
      .map((post) => {
        const postUrl = `${SITE_URL}/${post.slug}`;
        const description = stripHtml(post.excerpt || post.content || '').slice(0, 300);

        const pubDate = new Date(
          post.publishedAt || post.updatedAt || post.createdAt || new Date()
        ).toUTCString();

        return `
    <item>
      <title>${escapeXml(post.title || 'Sem título')}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
      })
      .join('');

    const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Cenas de Combate</title>
    <link>${SITE_URL}</link>
    <description>História militar, guerras, batalhas, estratégia e geopolítica.</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
${feedItems}
  </channel>
</rss>`;

    const feedPath = path.join(distPublicDir, 'feed.xml');
    fs.writeFileSync(feedPath, feedXml, 'utf-8');

    console.log(`✅ feed.xml gerado!`);
    console.log(`📁 Salvo em: ${feedPath}`);

    const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/feed.xml`;

    const robotsPath = path.join(distPublicDir, 'robots.txt');
    fs.writeFileSync(robotsPath, robotsTxt, 'utf-8');

    console.log(`✅ robots.txt gerado!`);
    console.log(`📁 Salvo em: ${robotsPath}`);
  } catch (error) {
    console.warn('⚠️ Aviso ao gerar sitemap/feed:', error.message);
    console.log('📝 Continuando com arquivos mínimos...');

    const minimalSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    const minimalFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Cenas de Combate</title>
    <link>${SITE_URL}</link>
    <description>História militar, guerras, batalhas, estratégia e geopolítica.</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  </channel>
</rss>`;

    const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/feed.xml`;

    fs.writeFileSync(path.join(distPublicDir, 'sitemap.xml'), minimalSitemap, 'utf-8');
    fs.writeFileSync(path.join(distPublicDir, 'feed.xml'), minimalFeed, 'utf-8');
    fs.writeFileSync(path.join(distPublicDir, 'robots.txt'), robotsTxt, 'utf-8');

    console.log('✅ sitemap.xml, feed.xml e robots.txt mínimos criados');
  }
}

generateSitemap();