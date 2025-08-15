import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { query, transaction } from './connection.js';

interface Migration {
  id: string;
  filename: string;
  sql: string;
}

async function createMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

async function getExecutedMigrations(): Promise<string[]> {
  const rows = await query<{ id: string }>('SELECT id FROM migrations ORDER BY executed_at');
  return rows.map(row => row.id);
}

async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = join(process.cwd(), 'database', 'migrations');
  
  try {
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();
    
    const migrations: Migration[] = [];
    
    for (const filename of sqlFiles) {
      const filepath = join(migrationsDir, filename);
      const sql = await readFile(filepath, 'utf-8');
      const id = filename.replace('.sql', '');
      
      migrations.push({ id, filename, sql });
    }
    
    return migrations;
  } catch (error) {
    console.error('Error loading migrations:', error);
    return [];
  }
}

async function executeMigration(migration: Migration): Promise<void> {
  await transaction(async (client) => {
    console.log(`Executing migration: ${migration.filename}`);
    
    await client.query(migration.sql);
    
    await client.query(
      'INSERT INTO migrations (id, filename) VALUES ($1, $2)',
      [migration.id, migration.filename]
    );
    
    console.log(`✓ Migration ${migration.filename} completed`);
  });
}

export async function runMigrations(): Promise<void> {
  try {
    console.log('Starting database migrations...');
    
    await createMigrationsTable();
    
    const executedMigrations = await getExecutedMigrations();
    const allMigrations = await loadMigrations();
    
    const pendingMigrations = allMigrations.filter(
      migration => !executedMigrations.includes(migration.id)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations found.');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations.`);
    
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}