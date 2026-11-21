import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

interface MockUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  chips: number;
}

interface MockSession {
  token: string;
  user_id: string;
  expires_at: Date;
}

// In-memory fallback tables
const memoryUsers = new Map<string, MockUser>();
const memorySessions = new Map<string, MockSession>();

// Seed a demo user
memoryUsers.set('demo-user-id', {
  id: 'demo-user-id',
  username: 'DemoPlayer',
  email: 'demo@p0ker.web',
  password_hash: '$2a$12$e6xU.5w2E7t0iC37oE7k5.sZ9YvNcmC6B5k9eR2KqU0vX5m1N0c1y', // demo123
  chips: 10000,
});

class HybridPool {
  private pgPool: Pool | null = null;
  private useMemoryFallback = false;

  constructor() {
    try {
      this.pgPool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://poker:poker_secret@localhost:5432/poker',
        connectionTimeoutMillis: 2000,
      });

      this.pgPool.connect((err, client, release) => {
        if (err) {
          console.log('[DB] PostgreSQL not connected. Active fallback: in-memory store.');
          this.useMemoryFallback = true;
        } else {
          console.log('[DB] Connected to PostgreSQL successfully.');
          release();
        }
      });
    } catch {
      this.useMemoryFallback = true;
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    if (!this.useMemoryFallback && this.pgPool) {
      try {
        const res = await this.pgPool.query(sql, params);
        return { rows: res.rows as T[], rowCount: res.rowCount ?? res.rows.length };
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) {
          this.useMemoryFallback = true;
          console.log('[DB] PostgreSQL connection failed. Switching to in-memory store.');
        } else {
          throw err;
        }
      }
    }

    // In-memory fallback query processor
    const lower = sql.toLowerCase().trim();

    // 1. Session lookup: SELECT u.id, u.username, u.chips FROM sessions s JOIN users u ...
    if (lower.includes('from sessions s') && lower.includes('join users u')) {
      const token = params[0];
      const session = memorySessions.get(token);
      if (session && session.expires_at > new Date()) {
        const user = memoryUsers.get(session.user_id);
        if (user) {
          return {
            rows: [{ id: user.id, username: user.username, chips: user.chips } as unknown as T],
            rowCount: 1,
          };
        }
      }
      return { rows: [], rowCount: 0 };
    }

    // 2. Insert session: INSERT INTO sessions
    if (lower.startsWith('insert into sessions')) {
      const [token, userId, expiresAt] = params;
      memorySessions.set(token, { token, user_id: userId, expires_at: new Date(expiresAt) });
      return { rows: [], rowCount: 1 };
    }

    // 3. Delete session: DELETE FROM sessions
    if (lower.startsWith('delete from sessions')) {
      const token = params[0];
      memorySessions.delete(token);
      return { rows: [], rowCount: 1 };
    }

    // 4. Register: INSERT INTO users
    if (lower.startsWith('insert into users')) {
      const [username, email, passwordHash] = params;
      // Check unique
      for (const u of memoryUsers.values()) {
        if (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()) {
          const err: any = new Error('Unique constraint violation');
          err.code = '23505';
          throw err;
        }
      }

      const id = uuidv4();
      const newUser: MockUser = {
        id,
        username,
        email,
        password_hash: passwordHash,
        chips: 10000,
      };
      memoryUsers.set(id, newUser);
      return {
        rows: [{ id: newUser.id, username: newUser.username, chips: newUser.chips } as unknown as T],
        rowCount: 1,
      };
    }

    // 5. Login lookup: SELECT id, username, password_hash, chips FROM users WHERE email = $1
    if (lower.startsWith('select') && lower.includes('from users') && lower.includes('where email =')) {
      const email = params[0];
      for (const u of memoryUsers.values()) {
        if (u.email.toLowerCase() === email.toLowerCase()) {
          return {
            rows: [{ id: u.id, username: u.username, password_hash: u.password_hash, chips: u.chips } as unknown as T],
            rowCount: 1,
          };
        }
      }
      return { rows: [], rowCount: 0 };
    }

    // 6. Deduct chips: UPDATE users SET chips = chips - $1 WHERE id = $2 AND chips >= $1
    if (lower.includes('chips = chips - $1')) {
      const [amount, userId] = params;
      const user = memoryUsers.get(userId);
      if (user && user.chips >= amount) {
        user.chips -= amount;
        return {
          rows: [{ chips: user.chips } as unknown as T],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 0 };
    }

    // 7. Add chips: UPDATE users SET chips = chips + $1 WHERE id = $2
    if (lower.includes('chips = chips + $1')) {
      const [amount, userId] = params;
      const user = memoryUsers.get(userId);
      if (user) {
        user.chips += amount;
        return {
          rows: [{ chips: user.chips } as unknown as T],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 0 };
    }

    return { rows: [], rowCount: 0 };
  }
}

const pool = new HybridPool();
export default pool;
