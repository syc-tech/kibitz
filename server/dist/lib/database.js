"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.ensureDatabase = ensureDatabase;
const pg_1 = require("pg");
const parseJson = (value) => (value ? JSON.parse(value) : null);
pg_1.types.setTypeParser(114, parseJson);
pg_1.types.setTypeParser(3802, parseJson);
const { DB_HOST, DB_PORT = '5432', DB_USER, DB_PASSWORD, DB_NAME, DB_SSL } = process.env;
const config = {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
};
if (DB_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false };
}
exports.pool = new pg_1.Pool(config);
async function ensureDatabase() {
    await exports.pool.query(`
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
//# sourceMappingURL=database.js.map