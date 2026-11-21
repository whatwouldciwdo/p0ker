import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/postgres';
import { cookieAuthMiddleware } from '../middleware/auth';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 604800000, // 7 days in ms
};

async function createSession(userId: string): Promise<string> {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)',
    [token, userId, expiresAt]
  );
  return token;
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    let email = req.body.email;

    if (!username || !password) {
      res.status(400).json({ error: 'Username dan password wajib diisi' });
      return;
    }

    if (username.length < 3 || username.length > 20) {
      res.status(400).json({ error: 'Username harus antara 3 - 20 karakter' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password minimal 6 karakter' });
      return;
    }

    if (!email) {
      email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@p0ker.local`;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, chips`,
      [username, email, passwordHash]
    );

    const user = result.rows[0];
    const token = await createSession(user.id);

    res.cookie('sid', token, COOKIE_OPTIONS);
    res.status(201).json({ id: user.id, username: user.username, chips: user.chips });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Username sudah digunakan, silakan pilih yang lain' });
    } else {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = req.body.username || req.body.email;
    const { password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ error: 'Username dan password wajib diisi' });
      return;
    }

    const result = await pool.query(
      'SELECT id, username, chips, password_hash FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [identifier.trim()]
    );

    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: 'Username atau password salah' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Username atau password salah' });
      return;
    }

    const token = await createSession(user.id);

    res.cookie('sid', token, COOKIE_OPTIONS);
    res.json({ id: user.id, username: user.username, chips: user.chips });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.sid;
    if (token) {
      await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
    }
    res.clearCookie('sid');
    res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', cookieAuthMiddleware, (req: Request, res: Response): void => {
  res.json(req.user);
});

export default router;
