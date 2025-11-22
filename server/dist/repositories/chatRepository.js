"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepository = void 0;
const database_1 = require("../lib/database");
class ChatRepository {
    async list() {
        const result = await database_1.pool.query('SELECT payload FROM chats');
        return result.rows.map((row) => row.payload);
    }
    async getByChannel(channel) {
        const result = await database_1.pool.query('SELECT payload FROM chats WHERE channel = $1', [channel]);
        return result.rows[0]?.payload;
    }
    async save(record) {
        await database_1.pool.query('INSERT INTO chats (channel, payload) VALUES ($1, $2) ON CONFLICT(channel) DO UPDATE SET payload = excluded.payload', [record.channel, JSON.stringify(record)]);
    }
    async saveMany(records) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            for (const record of records) {
                await client.query('INSERT INTO chats (channel, payload) VALUES ($1, $2) ON CONFLICT(channel) DO UPDATE SET payload = excluded.payload', [record.channel, JSON.stringify(record)]);
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.ChatRepository = ChatRepository;
//# sourceMappingURL=chatRepository.js.map