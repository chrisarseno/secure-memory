// Removed Google OAuth - using simple custom authentication
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { db } from './db';
import { users } from '@shared/db-schema';
import { eq } from 'drizzle-orm';
import type { Express, RequestHandler } from 'express';
import type { User } from '@shared/db-schema';

const pgStore = connectPgSimple(session);

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      username: string;
      role: string;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
    user?: {
      id: string;
      email: string;
      name: string;
      username: string;
      role: string;
    };
  }
}

export function setupAuth(app: Express) {
  // Session middleware
  app.use(session({
    store: new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      tableName: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'nexus-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true
    }
  }));

  // No passport needed for simple authentication

  // Simple user creation for chris.mwd20@gmail.com
  const createUserIfNeeded = async () => {
    try {
      const [existingUser] = await db.select().from(users).where(eq(users.email, 'chris.mwd20@gmail.com'));
      
      if (!existingUser) {
        await db.insert(users).values({
          email: 'chris.mwd20@gmail.com',
          name: 'Chris MWD',
          username: 'chris.mwd20@gmail.com',
          role: 'admin'
        });
        console.log('✅ Created user chris.mwd20@gmail.com');
      }
    } catch (error) {
      console.error('User creation error:', error);
    }
  };
  
  // Create user on startup
  createUserIfNeeded();

  // Simple session-based authentication - no passport needed

  // Email verification endpoint - now handles full authentication
  app.post('/api/auth/verify-username', (req, res) => {
    const { username } = req.body;
    if (username === 'chris.mwd20@gmail.com') {
      req.session.authenticated = true;
      req.session.user = {
        id: '1',
        email: 'chris.mwd20@gmail.com',
        name: 'Chris MWD',
        username: 'chris.mwd20@gmail.com',
        role: 'admin'
      };
      res.json({ success: true, redirect: '/dashboard' });
    } else {
      res.status(401).json({ error: 'Invalid email address' });
    }
  });

  // Removed Google OAuth routes

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/auth/user', (req, res) => {
    if (req.session.authenticated && req.session.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });
}

// Auth middleware for session-based authentication
export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.session.authenticated && req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.session.authenticated && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
};