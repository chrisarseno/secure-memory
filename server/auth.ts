import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
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
    usernameVerified?: boolean;
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

  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        const [existingUser] = await db.select().from(users).where(eq(users.googleId, profile.id));
        
        if (existingUser) {
          // Ensure this is chris.mwd20
          if (existingUser.username === 'chris.mwd20') {
            return done(null, {
              id: existingUser.id,
              email: existingUser.email || '',
              name: existingUser.name || '',
              username: existingUser.username || '',
              role: existingUser.role || 'admin'
            });
          } else {
            return done(new Error('Access restricted to authorized user only'));
          }
        }

        // For new users, only allow chris.mwd20
        const email = profile.emails?.[0]?.value;
        if (!email || !email.includes('chris.mwd20')) {
          return done(new Error('Access restricted to chris.mwd20 only'));
        }

        // Create new user
        const [newUser] = await db.insert(users).values({
          googleId: profile.id,
          email,
          name: profile.displayName,
          picture: profile.photos?.[0]?.value,
          username: 'chris.mwd20',
          role: 'admin'
        }).returning();

        return done(null, {
          id: newUser.id,
          email: newUser.email || '',
          name: newUser.name || '',
          username: newUser.username || '',
          role: newUser.role || 'admin'
        });
      } catch (error) {
        console.error('Google auth error:', error);
        return done(error);
      }
    }));
  }

  // Passport serialization
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (user) {
        done(null, {
          id: user.id,
          email: user.email || '',
          name: user.name || '',
          username: user.username || '',
          role: user.role || 'admin'
        });
      } else {
        done(null, null);
      }
    } catch (error) {
      done(error);
    }
  });

  // Username verification endpoint
  app.post('/api/auth/verify-username', (req, res) => {
    const { username } = req.body;
    if (username === 'chris.mwd20@gmail.com') {
      req.session.usernameVerified = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid username' });
    }
  });

  // Modified Google auth to check username verification
  app.get('/api/auth/google', (req, res, next) => {
    if (!req.session.usernameVerified) {
      return res.status(401).json({ error: 'Username verification required' });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  });

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=auth_failed' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/auth/user', (req, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });
}

// Auth middleware
export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
};