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
};

const TARGET_DB = process.env.DATABASE_URL;

async function migrateData() {
  let sourceConn, targetConn;
  try {
    console.log('[Migration] Connecting to source and target databases...');
    sourceConn = await mysql.createConnection(SOURCE_DB);
    targetConn = await mysql.createConnection(TARGET_DB);

    // Check if data already migrated
    const [[{ count: existingPosts }]] = await targetConn.query('SELECT COUNT(*) as count FROM posts');
    if (existingPosts > 0) {
      console.log(`[Migration] ✓ Data already migrated! Found ${existingPosts} posts in target database.`);
      await sourceConn.end();
      await targetConn.end();
      return;
    }

    // 1. Migrate categories
    console.log('[Migration] Migrating categories...');
    const [categories] = await sourceConn.query('SELECT * FROM categories');
    let categoryCount = 0;
    for (const cat of categories) {
      try {
        await targetConn.query(
          'INSERT INTO categories (id, name, slug, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
          [cat.id, cat.name, cat.slug, cat.description, cat.createdAt, cat.updatedAt]
        );
        categoryCount++;
      } catch (e) {
        console.warn(`[Migration] Skipped category ${cat.id}: ${e.message.substring(0, 50)}`);
      }
    }
    console.log(`[Migration] ✓ Migrated ${categoryCount}/${categories.length} categories`);

    // 2. Migrate posts
    console.log('[Migration] Migrating posts...');
    const [posts] = await sourceConn.query('SELECT * FROM posts');
    let postCount = 0;
    for (const post of posts) {
      try {
        await targetConn.query(
          'INSERT INTO posts (id, wpId, title, slug, content, excerpt, featuredImage, status, author, viewCount, publishedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [post.id, post.wpId, post.title, post.slug, post.content, post.excerpt, post.featuredImage, post.status, post.author, post.viewCount, post.publishedAt, post.createdAt, post.updatedAt]
        );
        postCount++;
      } catch (e) {
        console.warn(`[Migration] Skipped post ${post.id}: ${e.message.substring(0, 50)}`);
      }
    }
    console.log(`[Migration] ✓ Migrated ${postCount}/${posts.length} posts`);

    // 3. Migrate post_categories
    console.log('[Migration] Migrating post-category relationships...');
    const [postCategories] = await sourceConn.query('SELECT * FROM post_categories');
    let pcCount = 0;
    for (const pc of postCategories) {
      try {
        await targetConn.query(
          'INSERT INTO post_categories (id, postId, categoryId) VALUES (?, ?, ?)',
          [pc.id, pc.postId, pc.categoryId]
        );
        pcCount++;
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`[Migration] ✓ Migrated ${pcCount}/${postCategories.length} post-category relationships`);

    // 4. Migrate media
    console.log('[Migration] Migrating media...');
    const [media] = await sourceConn.query('SELECT * FROM media');
    let mediaCount = 0;
    for (const m of media) {
      try {
        await targetConn.query(
          'INSERT INTO media (id, wpUrl, s3Key, s3Url, filename, mimeType, fileSize, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [m.id, m.wpUrl, m.s3Key, m.s3Url, m.filename, m.mimeType, m.fileSize, m.createdAt]
        );
        mediaCount++;
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`[Migration] ✓ Migrated ${mediaCount}/${media.length} media files`);

    // 5. Migrate settings
    console.log('[Migration] Migrating settings...');
    const [settings] = await sourceConn.query('SELECT * FROM settings');
    let settingsCount = 0;
    for (const s of settings) {
      try {
        await targetConn.query(
          'INSERT INTO settings (id, `key`, value, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
          [s.id, s.key, s.value, s.description, s.createdAt, s.updatedAt]
        );
        settingsCount++;
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`[Migration] ✓ Migrated ${settingsCount}/${settings.length} settings`);

    console.log('[Migration] ✓ Data migration completed successfully!');
    console.log(`[Migration] Summary:`);
    console.log(`  - Categories: ${categoryCount}/${categories.length}`);
    console.log(`  - Posts: ${postCount}/${posts.length}`);
    console.log(`  - Post-Category relationships: ${pcCount}/${postCategories.length}`);
    console.log(`  - Media files: ${mediaCount}/${media.length}`);
    console.log(`  - Settings: ${settingsCount}/${settings.length}`);

  } catch (error) {
    console.error('[Migration] Error:', error.message);
    process.exit(1);
  } finally {
    if (sourceConn) await sourceConn.end();
    if (targetConn) await targetConn.end();
  }
}

migrateData();
