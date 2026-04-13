import { Router, type Request, type Response } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

const SignupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name required'),
  userType: z.enum(['host', 'client']),
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 3600000,
};

export function createAuthRoutes(pool: Pool): Router {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');
  const JWT_SECRET = process.env.JWT_SECRET;

  const signToken = (payload: { sub: string; email: string; userType: string }) =>
    jwt.sign(payload, JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' });

  const router = Router();

  router.post('/login', async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      const { email, password } = LoginSchema.parse(req.body);

      const result = await client.query(
        'SELECT id, email, password_hash, full_name, user_type, is_active FROM users WHERE email = $1',
        [email]
      );

      const user = result.rows[0];

      if (!user) return res.status(401).json({ error: 'Invalid email or password' });
      if (!user.is_active) return res.status(403).json({ error: 'Account is inactive' });

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) return res.status(401).json({ error: 'Invalid email or password' });

      const token = signToken({ sub: user.id, email: user.email, userType: user.user_type });
      res.cookie('auth_token', token, cookieOptions);
      res.json({ user: { id: user.id, email: user.email, fullName: user.full_name, userType: user.user_type } });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0].message });
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    } finally {
      client.release();
    }
  });

  router.post('/signup', async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, userType } = SignupSchema.parse(req.body);

      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });

      const passwordHash = await bcrypt.hash(password, 12);
      const businessName = userType === 'host' ? fullName : 'Personal';

      const result = await pool.query(
        `INSERT INTO users (id, email, password_hash, full_name, business_name, phone, user_type, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, '', $5, true, NOW(), NOW())
         RETURNING id, email, full_name, user_type`,
        [email, passwordHash, fullName, businessName, userType]
      );

      const user = result.rows[0];
      const token = signToken({ sub: user.id, email: user.email, userType: user.user_type });
      res.cookie('auth_token', token, cookieOptions);
      res.status(201).json({ user: { id: user.id, email: user.email, fullName: user.full_name, userType: user.user_type } });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0].message });
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Signup failed' });
    }
  });

  router.post('/logout', (_req: Request, res: Response) => {
    res.clearCookie('auth_token', { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.json({ message: 'Logged out successfully' });
  });

  router.get('/session', async (req: Request, res: Response) => {
    try {
      const token = req.cookies.auth_token;
      if (!token) return res.status(401).json({ error: 'No session' });

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const result = await pool.query(
        'SELECT id, email, full_name, user_type FROM users WHERE id = $1 AND is_active = true',
        [decoded.sub]
      );

      if (result.rows.length === 0) {
        res.clearCookie('auth_token');
        return res.status(401).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      res.json({ user: { id: user.id, email: user.email, fullName: user.full_name, userType: user.user_type } });
    } catch {
      res.clearCookie('auth_token');
      res.status(401).json({ error: 'Invalid session' });
    }
  });

  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const token = req.cookies.auth_token;
      if (!token) return res.status(401).json({ error: 'No session' });

      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch {
        res.clearCookie('auth_token');
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      const result = await pool.query(
        'SELECT id, email, full_name, user_type FROM users WHERE id = $1 AND is_active = true',
        [decoded.sub]
      );

      if (result.rows.length === 0) {
        res.clearCookie('auth_token');
        return res.status(401).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      const newToken = signToken({ sub: user.id, email: user.email, userType: user.user_type });
      res.cookie('auth_token', newToken, cookieOptions);
      res.json({ user: { id: user.id, email: user.email, fullName: user.full_name, userType: user.user_type } });
    } catch {
      res.clearCookie('auth_token');
      res.status(401).json({ error: 'Token refresh failed' });
    }
  });

  return router;
}

export default createAuthRoutes;
