import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { IdentityServiceAdapter } from '../grpc/adapters';

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

export function createAuthRoutes(): Router {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');
  const JWT_SECRET = process.env.JWT_SECRET;

  const router = Router();

  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = LoginSchema.parse(req.body);

      const response = await IdentityServiceAdapter.login(email, password);

      if (!response.success) {
        return res.status(401).json({ error: response.error_message || 'Invalid email or password' });
      }

      res.cookie('auth_token', response.access_token, cookieOptions);
      res.json({ user: { id: response.user_id, email: response.email, fullName: response.full_name, userType: response.user_type } });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0].message });
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  router.post('/signup', async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, userType } = SignupSchema.parse(req.body);

      const response = await IdentityServiceAdapter.register(email, password, fullName, userType);

      if (!response.success) {
        const msg = response.error_message || 'Signup failed';
        const statusCode = msg.toLowerCase().includes('already') ? 409 : 500;
        return res.status(statusCode).json({ error: msg });
      }

      res.cookie('auth_token', response.access_token, cookieOptions);
      res.status(201).json({ user: { id: response.user_id, email: response.email, fullName: response.full_name, userType: response.user_type } });
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

      const user = await IdentityServiceAdapter.getUser(decoded.sub);
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

      const response = await IdentityServiceAdapter.refreshToken(decoded.sub, token);

      if (!response.success) {
        res.clearCookie('auth_token');
        return res.status(401).json({ error: response.error_message || 'Token refresh failed' });
      }

      res.cookie('auth_token', response.access_token, cookieOptions);
      res.json({ user: { id: response.user_id, email: response.email, fullName: response.full_name, userType: response.user_type } });
    } catch {
      res.clearCookie('auth_token');
      res.status(401).json({ error: 'Token refresh failed' });
    }
  });

  return router;
}

export default createAuthRoutes;
