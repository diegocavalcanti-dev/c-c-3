import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment.');
  process.exit(1);
}

// Load data
const wpData = JSON.parse(readFileSync('/home/ubuntu/wordpress_data.json', 'utf8'));
const imageMap = JSON.parse(readFileSync('/home/ubuntu/image_url_map.json', 'utf8'));

const { categories, posts } = wpData;

console.log(`Loaded ${posts.length} posts and ${categories.length} categories`);
console.log(`Image mappings: ${Object.keys(imageMap).length}`);

// Replace image URLs in content
function replaceImageUrls(content) {
  if (!content) return content;
  let updated = content;
  for (const [oldUrl, newUrl] of Object.entries(imageMap)) {
    if (newUrl && newUrl !== oldUrl && !newUrl.includes('cenasdecombate.com/wp-content')) {
      updated = updated.replaceAll(oldUrl, newUrl);
    }
  }
  return updated;
}

function getS3Url(url) {
  if (!url) return null;
  const mapped = imageMap[url];
  if (mapped && !mapped.includes('cenasdecombate.com/wp-content')) return mapped;
  return url;
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Insert categories
    console.log('\n=== Inserting categories ===');
    for (const cat of categories) {
      try {
        await conn.execute(
          'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
          [cat.name, cat.slug, cat.description || null]
        );
        process.stdout.write('.');
      } catch (e) {
        console.error(`\nFailed to insert category ${cat.name}: ${e.message}`);
      }
    }
    console.log(`\nCategories done!`);

    // Get category map
    const [catRows] = await conn.execute('SELECT id, slug FROM categories');
    const catSlugToId = new Map(catRows.map(r => [r.slug, r.id]));
    console.log(`Category map: ${catSlugToId.size} entries`);

    // Insert posts
    console.log('\n=== Inserting posts ===');
    let inserted = 0;
    let failed = 0;

    for (const post of posts) {
      try {
        const content = replaceImageUrls(post.content);
        const featuredImage = getS3Url(post.featuredImage);
        const publishedAt = post.publishedAt ? new Date(post.publishedAt) : new Date();

        const [result] = await conn.execute(
          `INSERT INTO posts (wpId, title, slug, content, excerpt, featuredImage, author, status, publishedAt, viewCount)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, 0)
           ON DUPLICATE KEY UPDATE 
             title=VALUES(title), content=VALUES(content), excerpt=VALUES(excerpt),
             featuredImage=VALUES(featuredImage), updatedAt=NOW()`,
          [
            post.wpId || null,
            post.title,
            post.slug,
            content || '',
            post.excerpt || '',
            featuredImage,
            post.author || 'Cenas de Combate',
            publishedAt,
          ]
        );

        const postId = result.insertId || null;
        
        // Get actual post ID if it was a duplicate update
        let actualPostId = postId;
        if (!postId || postId === 0) {
          const [rows] = await conn.execute('SELECT id FROM posts WHERE slug=?', [post.slug]);
          actualPostId = rows[0]?.id;
        }

        if (actualPostId && post.categories && post.categories.length > 0) {
          await conn.execute('DELETE FROM post_categories WHERE postId=?', [actualPostId]);
          
          for (const catSlug of post.categories) {
            const catId = catSlugToId.get(catSlug);
            if (catId) {
              try {
                await conn.execute(
                  'INSERT IGNORE INTO post_categories (postId, categoryId) VALUES (?, ?)',
                  [actualPostId, catId]
                );
              } catch (e) {
                // ignore
              }
            }
          }
        }

        inserted++;
        if (inserted % 20 === 0) {
          process.stdout.write(`\n  ${inserted}/${posts.length}`);
        } else {
          process.stdout.write('.');
        }
      } catch (e) {
        failed++;
        console.error(`\nFailed: "${post.title}": ${e.message}`);
      }
    }

    console.log(`\n\n=== Import complete ===`);
    console.log(`Inserted/Updated: ${inserted}`);
    console.log(`Failed: ${failed}`);

    const [countResult] = await conn.execute('SELECT COUNT(*) as total FROM posts');
    const [catCount] = await conn.execute('SELECT COUNT(*) as total FROM categories');
    const [pcCount] = await conn.execute('SELECT COUNT(*) as total FROM post_categories');
    console.log(`\nDatabase stats:`);
    console.log(`  Posts: ${countResult[0].total}`);
    console.log(`  Categories: ${catCount[0].total}`);
    console.log(`  Post-Category links: ${pcCount[0].total}`);

  } finally {
    await conn.end();
  }
}

main().catch(console.error);
