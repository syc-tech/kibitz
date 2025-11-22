"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const node_crypto_1 = require("node:crypto");
const database_1 = require("../lib/database");
class UserRepository {
    async registerUser(username, email) {
        const existing = await this.findByUsername(username);
        if (existing) {
            return existing;
        }
        const record = {
            id: (0, node_crypto_1.randomUUID)(),
            username,
            email,
            otp: this.generateOtp(),
            registeredAt: new Date().toISOString(),
            services: []
        };
        await database_1.pool.query('INSERT INTO users (username, payload) VALUES ($1, $2)', [username.toLowerCase(), JSON.stringify(record)]);
        return record;
    }
    async findByUsername(username) {
        const result = await database_1.pool.query('SELECT payload FROM users WHERE username = $1', [
            username.toLowerCase()
        ]);
        return result.rows[0]?.payload;
    }
    async connectService(username, serviceName) {
        const user = await this.findByUsername(username);
        if (!user) {
            return undefined;
        }
        if (!user.services.find((svc) => svc.name === serviceName)) {
            user.services.push({ name: serviceName, connectedAt: new Date().toISOString() });
            await this.persist(user);
        }
        return user;
    }
    async persist(user) {
        await database_1.pool.query('INSERT INTO users (username, payload) VALUES ($1, $2) ON CONFLICT(username) DO UPDATE SET payload = excluded.payload', [user.username.toLowerCase(), JSON.stringify(user)]);
    }
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=userRepository.js.map