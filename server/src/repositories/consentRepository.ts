import { pool } from '../lib/database';
import { ConsentStatus } from '../types/consent';

export class ConsentRepository {
  async get(key: string): Promise<ConsentStatus | undefined> {
    const result = await pool.query<{ payload: ConsentStatus }>('SELECT payload FROM consents WHERE session_key = $1', [key]);
    return result.rows[0]?.payload;
  }

  async set(key: string, status: ConsentStatus): Promise<void> {
    await pool.query(
      'INSERT INTO consents (session_key, payload) VALUES ($1, $2) ON CONFLICT(session_key) DO UPDATE SET payload = excluded.payload',
      [key, JSON.stringify(status)]
    );
  }

  async delete(key: string): Promise<void> {
    await pool.query('DELETE FROM consents WHERE session_key = $1', [key]);
  }
}
