import { randomUUID } from 'node:crypto';
import { pool } from '../lib/database';

export interface ConnectedService {
  name: string;
  connectedAt: string;
}

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  otp: string;
  registeredAt: string;
  services: ConnectedService[];
}

export class UserRepository {
  async registerUser(username: string, email: string): Promise<UserRecord> {
    const existing = await this.findByUsername(username);
    if (existing) {
      return existing;
    }

    const record: UserRecord = {
      id: randomUUID(),
      username,
      email,
      otp: this.generateOtp(),
      registeredAt: new Date().toISOString(),
      services: []
    };

    await pool.query('INSERT INTO users (username, payload) VALUES ($1, $2)', [username.toLowerCase(), JSON.stringify(record)]);
    return record;
  }

  async findByUsername(username: string): Promise<UserRecord | undefined> {
    const result = await pool.query<{ payload: UserRecord }>('SELECT payload FROM users WHERE username = $1', [
      username.toLowerCase()
    ]);
    return result.rows[0]?.payload;
  }

  async connectService(username: string, serviceName: string): Promise<UserRecord | undefined> {
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

  async persist(user: UserRecord): Promise<void> {
    await pool.query(
      'INSERT INTO users (username, payload) VALUES ($1, $2) ON CONFLICT(username) DO UPDATE SET payload = excluded.payload',
      [user.username.toLowerCase(), JSON.stringify(user)]
    );
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
