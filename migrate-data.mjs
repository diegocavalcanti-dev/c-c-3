import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const SOURCE_DB = {
  host: 'gateway05.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '7d5QJKcFWaFNG88.root',
  password: 'EKR3606sBoGnNkq9fjL6',
  database: 'MbzAujLxp5VqiAtrSCvhfs',
  ssl: {},
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const TARGET_DB = process.env.DATABASE_URL;

async function migrateData() {
  let sourceConn, targetConn;
  try {
    console.log('[Migration] Connecting to source and target databases...');
    sourceConn = await mysql.createConnection(SOURCE_DB);
    targetConn = await mysql.createConnection(TARGET_DB);

    // 1. Migrate categories
    console.log('[Migration] Migrating categories...');
    const [categories] = await sourceConn.query('SELECT * FROM categories');
    for (const cat of categories) {
      await targetConn.query(
        'INSERT INTO categories (id, name, slug, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [cat.id, cat.name, cat.slug, cat.description, cat.createdAt, cat.updatedAt]
      );
    }
    console.log(`[Migration] ✓ Migrated ${categories.length} categories`);

    // 2. Migrate posts
    console.log('[Migration] Migrating posts...');
    const [posts] = await sourceConn.query('SELECT * FROM posts');
    for (const post of posts) {
      await targetConn.query(
        'INSERT INTO posts (id, wpId, title, slug, content, excerpt, featuredImage, status, author, viewCount, publishedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [post.id, post.wpId, post.title, post.slug, post.content, post.excerpt, post.featuredImage, post.status, post.author, post.viewCount, post.publishedAt, post.createdAt, post.updatedAt]
      );
    }
    console.log(`[Migration] ✓ Migrated ${posts.length} posts`);

    // 3. Migrate post_categories
    console.log('[Migration] Migrating post-category relationships...');
    const [postCategories] = await sourceConn.query('SELECT * FROM post_categories');
    for (const pc of postCategories) {
      await targetConn.query(
        'INSERT INTO post_categories (id, postId, categoryId) VALUES (?, ?, ?)',
        [pc.id, pc.postId, pc.categoryId]
      );
    }
    console.log(`[Migration] ✓ Migrated ${postCategories.length} post-category relationships`);

    // 4. Migrate media
    console.log('[Migration] Migrating media...');
    const [media] = await sourceConn.query('SELECT * FROM media');
    for (const m of media) {
      await targetConn.query(
        'INSERT INTO media (id, wpUrl, s3Key, s3Url, filename, mimeType, fileSize, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [m.id, m.wpUrl, m.s3Key, m.s3Url, m.filename, m.mimeType, m.fileSize, m.createdAt]
      );
    }
    console.log(`[Migration] ✓ Migrated ${media.length} media files`);

    // 5. Migrate settings
    console.log('[Migration] Migrating settings...');
    const [settings] = await sourceConn.query('SELECT * FROM settings');
    for (const s of settings) {
      await targetConn.query(
        'INSERT INTO settings (id, `key`, value, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [s.id, s.key, s.value, s.description, s.createdAt, s.updatedAt]
      );
    }
    console.log(`[Migration] ✓ Migrated ${settings.length} settings`);

    console.log('[Migration] ✓ Data migration completed successfully!');
    console.log(`[Migration] Summary:`);
    console.log(`  - Categories: ${categories.length}`);
    console.log(`  - Posts: ${posts.length}`);
    console.log(`  - Post-Category relationships: ${postCategories.length}`);
    console.log(`  - Media files: ${media.length}`);
    console.log(`  - Settings: ${settings.length}`);

  } catch (error) {
    console.error('[Migration] Error:', error.message);
    process.exit(1);
  } finally {
    if (sourceConn) await sourceConn.end();
    if (targetConn) await targetConn.end();
  }
}

migrateData();
