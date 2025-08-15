import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Database query executed', { text, duration, rows: res.rowCount });
    return res.rows;
  } catch (error) {
    console.error('Database query error:', { text, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export async function queryWithRowCount<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[], rowCount: number }> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Database query executed', { text, duration, rows: res.rowCount });
    return { rows: res.rows, rowCount: res.rowCount || 0 };
  } catch (error) {
    console.error('Database query error:', { text, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}

process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);