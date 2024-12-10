import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import sgMail from '@sendgrid/mail';
import { users, palettes, passwordResetTokens, insertUserSchema } from "@db/schema";
import { db } from "../db";
import { eq, sql } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  console.error('[SendGrid] API key is missing. Email functionality will not work.');
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('[SendGrid] API key successfully configured');
}

// Verify SendGrid configuration
async function verifySendGridConfig() {
  try {
    if (!SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }
    return true;
  } catch (error) {
    console.error('[SendGrid] Configuration verification failed:', error);
    return false;
  }
}

// Token generation for password reset
const generateResetToken = () => {
  return randomBytes(32).toString('hex');
};

interface ResetToken {
  token: string;
  email: string;
  expires: Date;
}

// Database functions for token management
async function storeResetToken(token: string, userId: number, expires: Date) {
  await db
    .insert(passwordResetTokens)
    .values({
      token,
      user_id: userId,
      expires,
    });
}

async function getResetToken(token: string) {
  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);
  return resetToken;
}

async function deleteResetToken(token: string) {
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token));
}

// Cleanup expired tokens
async function cleanupExpiredTokens() {
  await db
    .delete(passwordResetTokens)
    .where(sql`${passwordResetTokens.expires} < NOW()`);
}
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64,
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
    }
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);

  // Add rate limiting with proper typing
  const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

  const isProduction = process.env.NODE_ENV === 'production';
  const sessionConfig: session.SessionOptions = {
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: isProduction ? true : "auto", // Force secure in production, auto in dev
      httpOnly: true,
      sameSite: isProduction ? 'none' as const : 'lax' as const,
      path: '/',
    },
    secret: process.env.SESSION_SECRET || process.env.REPL_ID || "color-palette-secret",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: new MemoryStore({
      checkPeriod: 86400000, // 24 hours
      max: 1000, // Reduce max sessions to prevent memory issues
      ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
      stale: false, // Don't serve stale data
      dispose: (key, val) => {
        console.log('\n[Session Store Event]', new Date().toISOString());
        console.log('Session disposed:', key);
        console.log('Session value:', val);
      },
      noDisposeOnSet: true,
      // Remove touchAfter as it may cause issues with session updates
    }),
    name: 'sessionId',
    proxy: true // Always trust the reverse proxy in Replit environment
  };

  if (isProduction) {
    app.set('trust proxy', 1); // Trust first proxy
  }

  app.use(session(sessionConfig));
  app.use(passport.initialize());
  app.use(passport.session());

  // Add session debugging after session middleware is initialized
  app.use((req, res, next) => {
    try {
      console.log('\n[Session Debug]', new Date().toISOString());
      console.log('Session ID:', req.sessionID);
      console.log('Cookie Settings:', req.session?.cookie);
      console.log('Session User:', req.session?.passport?.user);
      console.log('Session State:', {
        authenticated: req.isAuthenticated(),
        hasSession: !!req.session,
        hasCookie: !!req.session?.cookie
      });
    } catch (error) {
      console.error('Error in session debug middleware:', error);
    }
    next();
  });

  // Local Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            return done(null, false, { message: "Incorrect email." });
          }

          const isMatch = await crypto.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect password." });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log('\n[Passport Serialize]', new Date().toISOString());
    console.log('Serializing user:', user);
    const serialized = { id: user.id, email: user.email, timestamp: Date.now() };
    console.log('Serialized data:', serialized);
    done(null, serialized);
  });

  passport.deserializeUser((serializedUser: { id: number; email: string; timestamp: number }, done) => {
    console.log('\n[Passport Deserialize]', new Date().toISOString());
    console.log('Deserializing data:', serializedUser);
    // We could add additional validation here if needed
    const user = { id: serializedUser.id, email: serializedUser.email };
    console.log('Deserialized user:', user);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send(result.error.message);
      }

      const { email, password } = result.data;
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Email already exists");
      }

      const hashedPassword = await crypto.hash(password);
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
        })
        .returning();

      // Get the palette data from the session
      const sessionPalette = req.session.palette;
      let palette: typeof palettes.$inferSelect | undefined;

      if (sessionPalette) {
        // Create the palette for the new user
        [palette] = await db
          .insert(palettes)
          .values({
            user_id: newUser.id,
            name: sessionPalette.name,
            colors: sessionPalette.colors,
          })
          .returning();

        // Clear the session palette
        delete req.session.palette;
      }

      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          ok: true,
          message: "Registration successful",
          user: { id: newUser.id, email: newUser.email },
          palette: palette // Return the created palette if it exists
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const attempts = loginAttempts.get(clientIp) || { count: 0, lastAttempt: 0 };
    const rememberMe = req.body.rememberMe === true;

    console.log('\n[Login Request]', new Date().toISOString());
    console.log('Client IP:', clientIp);
    console.log('Remember Me:', rememberMe);
    console.log('Session ID:', req.sessionID);
    console.log('Session Cookie:', {
      maxAge: req.session?.cookie?.maxAge,
      expires: req.session?.cookie?.expires,
      secure: req.session?.cookie?.secure,
      httpOnly: req.session?.cookie?.httpOnly,
      sameSite: req.session?.cookie?.sameSite
    });
    
    // Store the palette data before authentication
    const sessionPalette = req.session.palette;
    console.log('[Login] Current session palette before auth:', sessionPalette);

    // Check if user is locked out
    if (attempts.count >= MAX_ATTEMPTS && now - attempts.lastAttempt < LOCKOUT_TIME) {
      const remainingTime = Math.ceil((LOCKOUT_TIME - (now - attempts.lastAttempt)) / 1000 / 60);
      return res.status(429).send(`Too many login attempts. Please try again in ${remainingTime} minutes.`);
    }

    // Reset attempts if lockout period has passed
    if (now - attempts.lastAttempt > LOCKOUT_TIME) {
      attempts.count = 0;
    }

    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        // Update login attempts
        attempts.count += 1;
        attempts.lastAttempt = now;
        loginAttempts.set(clientIp, attempts);

        return res.status(400).send(info?.message ?? "Login failed");
      }

      // Successful login - reset attempts
      loginAttempts.delete(clientIp);

      // Use a promise to handle login
      const loginPromise = new Promise((resolve, reject) => {
        req.login(user, (err) => {
          if (err) reject(err);
          else resolve(user);
        });
      });

      loginPromise
        .then((user: any) => {
          if (rememberMe) {
            // Extend session expiry for remember me
            if (req.session.cookie) {
              req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
            }
          }

          // Restore the palette data after successful authentication
          if (sessionPalette) {
            req.session.palette = sessionPalette;
            console.log('[Login] Restored session palette after auth:', req.session.palette);
          }

          // Save session explicitly with the restored palette
          req.session.save((err) => {
            if (err) {
              console.error('[Login] Error saving session:', err);
              return next(err);
            }

            console.log('\n[Login Session Details]', new Date().toISOString());
            console.log('Session ID:', req.sessionID);
            console.log('Session Cookie:', {
              maxAge: req.session.cookie?.maxAge,
              expires: req.session.cookie?._expires,
              secure: req.session.cookie?.secure,
              httpOnly: req.session.cookie?.httpOnly,
              path: req.session.cookie?.path,
              sameSite: req.session.cookie?.sameSite
            });
            console.log('Session Data:', {
              user: req.session.passport?.user,
              palette: req.session.palette
            });
            console.log('Headers:', {
              'set-cookie': res.getHeader('set-cookie')
            });

            return res.json({
              message: "Login successful",
              user: { id: user.id, email: user.email },
              sessionExpiry: req.session.cookie?.maxAge,
              sessionId: req.sessionID
            });
          });
        })
        .catch(next);
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("Not logged in");
  });
}