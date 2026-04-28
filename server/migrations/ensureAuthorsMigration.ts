import type { Pool } from "mysql2/promise";

let migrationPromise: Promise<void> | null = null;

export async function ensureAuthorsMigration(pool: Pool) {
  if (migrationPromise) {
    return migrationPromise;
  }

  migrationPromise = (async () => {
    console.log("[Migration] Checking authors schema...");

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS \`authors\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`slug\` varchar(255) NOT NULL,
        \`bio\` text,
        \`avatar\` text,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`authors_slug_unique\` (\`slug\`)
      )
    `);

    try {
      await pool.execute(`
        ALTER TABLE \`posts\`
        ADD COLUMN \`authorId\` int NULL
      `);

      console.log("[Migration] posts.authorId column created");
    } catch (error: any) {
      if (error?.code === "ER_DUP_FIELDNAME") {
        console.log("[Migration] posts.authorId column already exists");
      } else {
        throw error;
      }
    }

    await pool.execute(`
      INSERT IGNORE INTO \`authors\` (\`name\`, \`slug\`, \`bio\`, \`avatar\`)
      VALUES (
        'Cenas de Combate',
        'cenas-de-combate',
        'História militar, geopolítica e conflitos.',
        NULL
      )
    `);

    await pool.execute(`
      UPDATE \`posts\`
      SET \`authorId\` = (
        SELECT \`id\`
        FROM \`authors\`
        WHERE \`slug\` = 'cenas-de-combate'
        LIMIT 1
      )
      WHERE \`authorId\` IS NULL
    `);

    console.log("[Migration] Authors migration completed");
  })();

  return migrationPromise;
}