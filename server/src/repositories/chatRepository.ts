import { pool } from '../lib/database';
import { ChatRecord } from '../types/chat';

export class ChatRepository {
  async list(): Promise<ChatRecord[]> {
    const result = await pool.query<{ payload: ChatRecord }>('SELECT payload FROM chats');
    return result.rows.map((row) => row.payload);
  }

  async getByChannel(channel: string): Promise<ChatRecord | undefined> {
    const result = await pool.query<{ payload: ChatRecord }>('SELECT payload FROM chats WHERE channel = $1', [channel]);
    return result.rows[0]?.payload;
  }

  async save(record: ChatRecord): Promise<void> {
    await pool.query(
      'INSERT INTO chats (channel, payload) VALUES ($1, $2) ON CONFLICT(channel) DO UPDATE SET payload = excluded.payload',
      [record.channel, JSON.stringify(record)]
    );
  }

  async saveMany(records: ChatRecord[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const record of records) {
        await client.query(
          'INSERT INTO chats (channel, payload) VALUES ($1, $2) ON CONFLICT(channel) DO UPDATE SET payload = excluded.payload',
          [record.channel, JSON.stringify(record)]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
