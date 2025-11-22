"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentRepository = void 0;
const database_1 = require("../lib/database");
class ConsentRepository {
    async get(key) {
        const result = await database_1.pool.query('SELECT payload FROM consents WHERE session_key = $1', [key]);
        return result.rows[0]?.payload;
    }
    async set(key, status) {
        await database_1.pool.query('INSERT INTO consents (session_key, payload) VALUES ($1, $2) ON CONFLICT(session_key) DO UPDATE SET payload = excluded.payload', [key, JSON.stringify(status)]);
    }
    async delete(key) {
        await database_1.pool.query('DELETE FROM consents WHERE session_key = $1', [key]);
    }
}
exports.ConsentRepository = ConsentRepository;
//# sourceMappingURL=consentRepository.js.map