import mysql from 'mysql2/promise';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(connectionString);

try {
  console.log('Creating authors table...');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`authors\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`slug\` varchar(255) NOT NULL,
      \`bio\` text,
      \`avatar\` text,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`authors_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`authors_slug_unique\` UNIQUE(\`slug\`)
    )
  `);
  console.log('✓ Authors table created');

  console.log('Adding authorId column to posts...');
  await connection.execute(`
    ALTER TABLE \`posts\` ADD COLUMN \`authorId\` int NULL
  `).catch(err => {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('✓ authorId column already exists');
    } else {
      throw err;
    }
  });
  console.log('✓ Migration completed');
} catch (error) {
  console.error('Migration error:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
