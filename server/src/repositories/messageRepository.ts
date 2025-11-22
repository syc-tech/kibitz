import { pool } from '../lib/database';
import { MessageRecord } from '../types/chat';

export class MessageRepository {
  async append(record: MessageRecord): Promise<void> {
    await pool.query(
      `INSERT INTO messages (
        id, chat_id, shared_group_id, author_id, author_key, original_message, rendered_message, posted_at, channel
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT(id) DO UPDATE SET
        rendered_message = excluded.rendered_message,
        original_message = excluded.original_message,
        posted_at = excluded.posted_at`,
      [
        record.id,
        record.chatId,
        record.sharedGroupId,
        record.authorId,
        record.authorKey,
        record.originalMessage,
        record.renderedMessage,
        record.postedAt,
        record.channel ?? null
      ]
    );
  }

  async findBySharedGroup(sharedGroupId: string): Promise<MessageRecord[]> {
    const result = await pool.query<MessageRow>(
      'SELECT id, chat_id, shared_group_id, author_id, author_key, original_message, rendered_message, posted_at, channel FROM messages WHERE shared_group_id = $1 ORDER BY posted_at ASC',
      [sharedGroupId]
    );
    return result.rows.map(mapRow);
  }
}

interface MessageRow {
  id: string;
  chat_id: string;
  shared_group_id: string;
  author_id: string;
  author_key: string;
  original_message: string;
  rendered_message: string;
  posted_at: Date;
  channel: string | null;
}

function mapRow(row: MessageRow): MessageRecord {
  return {
    id: row.id,
    chatId: row.chat_id,
    sharedGroupId: row.shared_group_id,
    authorId: row.author_id,
    authorKey: row.author_key,
    originalMessage: row.original_message,
    renderedMessage: row.rendered_message,
    postedAt: row.posted_at instanceof Date ? row.posted_at.toISOString() : String(row.posted_at),
    channel: row.channel ?? undefined
  };
}
