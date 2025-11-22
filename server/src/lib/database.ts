import { Pool, PoolConfig, types } from 'pg';

const parseJson = (value: string | null) => (value ? JSON.parse(value) : null);
types.setTypeParser(114, parseJson);
types.setTypeParser(3802, parseJson);

const {
  DB_HOST,
  DB_PORT = '5432',
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_SSL
} = process.env;

const config: PoolConfig = {
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME
};

const usingSocket = DB_HOST?.startsWith('/');
if (!usingSocket && DB_SSL === 'true') {
  config.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(config);

export async function ensureDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS consents (
      session_key TEXT PRIMARY KEY,
      payload JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chats (
      channel TEXT PRIMARY KEY,
      payload JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      shared_group_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_key TEXT NOT NULL,
      original_message TEXT NOT NULL,
      rendered_message TEXT NOT NULL,
      posted_at TIMESTAMPTZ NOT NULL,
      channel TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      payload JSONB NOT NULL
    );
  `);
}
