import { Router, type Request, type Response } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// Zod validation schemas
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

export function createAuthRoutes(pool: Pool): Router {
  const router = Router();

  /**
   * POST /auth/login
   * Authenticate user with email and password
   */
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const validatedData = LoginSchema.parse(req.body);

      // Query user from database
      const result = await pool.query(
        'SELECT id, email, password_hash, full_name, user_type, is_active FROM users WHERE email = $1',
        [validatedData.email]
      );

      const user = result.rows[0];

      // Verify user exists and is active
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is inactive' });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(
        validatedData.password,
        user.password_hash
      );

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          userType: user.user_type,
        },
        process.env.JWT_SECRET || 'dev-secret-key',
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      // Set HTTP-only secure cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000, // 1 hour
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          userType: user.user_type,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  /**
   * POST /auth/signup
   * Create a new user account
   */
  router.post('/signup', async (req: Request, res: Response) => {
    try {
      const validatedData = SignupSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [validatedData.email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);

      // Create user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, user_type, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())
         RETURNING id, email, full_name, user_type`,
        [
          validatedData.email,
          hashedPassword,
          validatedData.fullName,
          validatedData.userType,
        ]
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          userType: user.user_type,
        },
        process.env.JWT_SECRET || 'dev-secret-key',
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      // Set HTTP-only secure cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000, // 1 hour
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          userType: user.user_type,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Signup failed' });
    }
  });

  /**
   * POST /auth/logout
   * Clear authentication cookie
   */
  router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({ message: 'Logged out successfully' });
  });

  /**
   * GET /auth/session
   * Get current user from JWT token
   */
  router.get('/session', async (req: Request, res: Response) => {
    try {
      const token = req.cookies.auth_token;

      if (!token) {
        return res.status(401).json({ error: 'No session' });
      }

      // Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'dev-secret-key'
      ) as any;

      // Query user to get latest data
      const result = await pool.query(
        'SELECT id, email, full_name, user_type FROM users WHERE id = $1 AND is_active = true',
        [decoded.sub]
      );

      if (result.rows.length === 0) {
        res.clearCookie('auth_token');
        return res.status(401).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          userType: user.user_type,
        },
      });
    } catch (error) {
      console.error('Session error:', error);
      res.clearCookie('auth_token');
      res.status(401).json({ error: 'Invalid session' });
    }
  });

  /**
   * POST /auth/refresh
   * Refresh authentication token
   */
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const token = req.cookies.auth_token;

      if (!token) {
        return res.status(401).json({ error: 'No session' });
      }

      // Verify token (even if expired, we decode it)
      let decoded: any;
      try {
        decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'dev-secret-key'
        );
      } catch (err: any) {
        if (err.name !== 'TokenExpiredError') {
          throw err;
        }
        // Decode without verification if expired
        decoded = jwt.decode(token) as any;
      }

      if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Query user
      const result = await pool.query(
        'SELECT id, email, full_name, user_type FROM users WHERE id = $1 AND is_active = true',
        [decoded.sub]
      );

      if (result.rows.length === 0) {
        res.clearCookie('auth_token');
        return res.status(401).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      // Generate new token
      const newToken = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          userType: user.user_type,
        },
        process.env.JWT_SECRET || 'dev-secret-key',
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      // Set new cookie
      res.cookie('auth_token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000,
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          userType: user.user_type,
        },
      });
    } catch (error) {
      console.error('Refresh error:', error);
      res.clearCookie('auth_token');
      res.status(401).json({ error: 'Token refresh failed' });
    }
  });

  return router;
}

export default createAuthRoutes;
