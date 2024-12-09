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

  app.use(
    session({
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        path: '/'
      },
      secret: process.env.SESSION_SECRET || process.env.REPL_ID || "color-palette-secret",
      resave: false,
      saveUninitialized: true,
      rolling: true,
      store: new MemoryStore({
        checkPeriod: 86400000,
        max: 100000,
        ttl: 30 * 24 * 60 * 60 * 1000 // 30 days
      }),
      name: 'sessionId'
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/auth/google/callback",
    scope: ["profile", "email"]
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, profile.emails?.[0]?.value || ''))
        .limit(1);

      if (existingUser) {
        return done(null, existingUser);
      }

      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          email: profile.emails?.[0]?.value || '',
          password: '', // No password for Google auth
          provider: 'google',
          provider_id: profile.id,
        })
        .returning();

      return done(null, newUser);
    } catch (err) {
      return done(err as Error);
    }
  }));

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
    done(null, { id: user.id, email: user.email, timestamp: Date.now() });
  });

  passport.deserializeUser((serializedUser: { id: number; email: string; timestamp: number }, done) => {
    // We could add additional validation here if needed
    done(null, { id: serializedUser.id, email: serializedUser.email });
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
      let palette;

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

          // Save session explicitly
          req.session.save((err) => {
            if (err) {
              return next(err);
            }

            return res.json({
              message: "Login successful",
              user: { id: user.id, email: user.email },
              sessionExpiry: req.session.cookie?.maxAge
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

  // Password reset request endpoint
  app.post("/api/request-password-reset", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      // Check if user exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        // Don't reveal if user exists
        return res.json({ message: "If an account exists with this email, you will receive a password reset link." });
      }

      // Generate reset token
      const token = generateResetToken();
      const expires = new Date(Date.now() + 3600000); // 1 hour expiry

      // Store token in database
      await storeResetToken(token, user.id, expires);
      console.log(`[Password Reset] Token stored for ${email}:`, {
        token: token.substring(0, 8) + '...',
        expires,
        timestamp: new Date().toISOString()
      });

      // Send reset email
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
      const msg = {
        to: email,
        from: {
          email: 'hi@diego.bio',
          name: 'Color Palette App'
        },
        subject: 'Password Reset Request',
        text: `To reset your password, click the following link: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this password reset, please ignore this email.`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Reset Your Password</title>
            </head>
            <body>
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #111827; margin-bottom: 20px;">Reset Your Password</h2>
                <p style="color: #374151; line-height: 1.5;">You have requested to reset your password. Click the button below to set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 500;">
                    Reset Password
                  </a>
                </div>
                <p style="color: #374151; line-height: 1.5;">This link will expire in 1 hour for security reasons.</p>
                <p style="color: #374151; line-height: 1.5;">If you didn't request this password reset, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
                <p style="color: #6B7280; font-size: 14px;">This is an automated message, please do not reply to this email.</p>
              </div>
            </body>
          </html>
        `,
        trackingSettings: {
          clickTracking: { enable: false },
          openTracking: { enable: true }
        },
        mailSettings: {
          sandboxMode: {
            enable: false // Disable sandbox mode for testing
          }
        }
      };

      try {
        if (!SENDGRID_API_KEY) {
          console.error('[Password Reset] SendGrid API key is missing');
          return res.status(500).json({ 
            error: "Email service is not configured. Please contact support.",
            code: 'CONFIG_ERROR'
          });
        }

        console.log('[Password Reset] Attempting to send email:', {
          to: email,
          from: msg.from,
          subject: msg.subject,
          resetUrlLength: resetUrl.length,
          timestamp: new Date().toISOString()
        });

        const response = await sgMail.send(msg);

        if (!response || !response[0]) {
          throw new Error('No response received from SendGrid');
        }

        console.log('[Password Reset] Email sent successfully:', {
          email,
          messageId: response[0].headers['x-message-id'],
          statusCode: response[0].statusCode,
          timestamp: new Date().toISOString()
        });

      } catch (emailError: any) {
        console.error('[Password Reset] Failed to send email:', {
          error: emailError.message,
          code: emailError.code,
          name: emailError.name,
          timestamp: new Date().toISOString()
        });

        if (emailError.response) {
          console.error('[Password Reset] SendGrid API response:', {
            statusCode: emailError.response.statusCode,
            body: emailError.response.body,
            headers: emailError.response.headers
          });
        }

        // Check specific error cases
        if (emailError.code === 401) {
          return res.status(500).json({ 
            error: "Email service authentication failed. Please contact support.",
            code: 'AUTH_ERROR'
          });
        } else if (emailError.code === 403) {
          return res.status(500).json({ 
            error: "Email service permissions error. Please contact support.",
            code: 'PERMISSION_ERROR'
          });
        }

        return res.status(500).json({ 
          error: "We're having trouble sending the reset email at the moment. Please try again in a few minutes.",
          code: 'SEND_ERROR',
          details: process.env.NODE_ENV === 'development' ? emailError.message : undefined,
          message: "Email service temporarily unavailable"
        });
      }

      res.json({ message: "If an account exists with this email, you will receive a password reset link." });
    } catch (error: any) {
      console.error('Password reset error:', error);
      res.status(500).json({ 
        error: "Failed to process password reset request",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
  // Validate reset token endpoint
  app.get("/api/validate-reset-token", async (req, res) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      console.log('[Password Reset] Missing or invalid token:', { token });
      return res.status(400).json({ 
        valid: false,
        error: "Missing or invalid token" 
      });
    }

    // URL decode the token
    const decodedToken = decodeURIComponent(token);
    console.log('[Password Reset] Processing token:', {
      originalToken: token.substring(0, 8) + '...',
      decodedToken: decodedToken.substring(0, 8) + '...',
      tokenLength: decodedToken.length,
      timestamp: new Date().toISOString()
    });

    if (!/^[a-f0-9]{64}$/i.test(decodedToken)) {
      console.log('[Password Reset] Invalid token format after decoding:', { 
        decodedToken: decodedToken.substring(0, 8) + '...',
        length: decodedToken.length
      });
      return res.status(400).json({ 
        valid: false,
        error: "Invalid token format" 
      });
    }

    try {
      // Clean up expired tokens first
      await cleanupExpiredTokens();

      // Use the decoded token for database lookup
      const resetToken = await getResetToken(decodedToken);
      console.log('[Password Reset] Token lookup result:', {
        token: decodedToken.substring(0, 8) + '...',
        found: !!resetToken,
        timestamp: new Date().toISOString()
      });

      if (!resetToken) {
        console.log('[Password Reset] Token not found:', {
          token: decodedToken.substring(0, 8) + '...',
          timestamp: new Date().toISOString()
        });
        return res.status(400).json({ 
          valid: false,
          error: "Invalid token" 
        });
      }

      const now = new Date();
      const isExpired = resetToken.expires < now;
      const timeRemaining = Math.floor((resetToken.expires.getTime() - now.getTime()) / 1000);

      console.log('[Password Reset] Token expiry check:', {
        token: decodedToken.substring(0, 8) + '...',
        expiryTime: resetToken.expires.toISOString(),
        currentTime: now.toISOString(),
        isExpired,
        timeRemaining: `${timeRemaining}s`,
        timeRemainingMinutes: Math.ceil(timeRemaining / 60)
      });

      if (isExpired) {
        // Remove expired token
        await deleteResetToken(decodedToken);
        console.log('[Password Reset] Expired token removed:', {
          token: decodedToken.substring(0, 8) + '...',
          timestamp: new Date().toISOString()
        });
        return res.status(400).json({ 
          valid: false,
          error: "Token has expired",
          expired: true
        });
      }

      // Add warning if token is close to expiration
      const warningThreshold = 5 * 60; // 5 minutes in seconds
      const expiryWarning = timeRemaining < warningThreshold ? 
        `Token will expire in ${Math.ceil(timeRemaining / 60)} minutes` : null;

      res.json({ 
        valid: true,
        message: "Token is valid",
        expiryWarning
      });
    } catch (error) {
      console.error('[Password Reset] Token validation error:', {
        token: decodedToken.substring(0, 8) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      res.status(500).json({
        valid: false,
        error: "Failed to validate token"
      });
    }
  });


  // Reset password endpoint
  app.post("/api/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || typeof token !== 'string') {
      console.log('[Password Reset] Missing or invalid token in reset request');
      return res.status(400).json({
        error: "Missing or invalid token"
      });
    }

    // URL decode the token
    const decodedToken = decodeURIComponent(token);

    // Validate token format after decoding
    if (!/^[a-f0-9]{64}$/i.test(decodedToken)) {
      console.log('[Password Reset] Invalid token format after decoding:', {
        tokenLength: decodedToken.length,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        error: "Invalid token format"
      });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      console.log('[Password Reset] Invalid password format in reset request');
      return res.status(400).json({
        error: "Password must be at least 8 characters long"
      });
    }

    try {
      // Clean up expired tokens first
      await cleanupExpiredTokens();

      // Get token data using decoded token
      const resetToken = await getResetToken(decodedToken);

      console.log('[Password Reset] Token lookup result:', {
        token: decodedToken.substring(0, 8) + '...',
        found: !!resetToken,
        timestamp: new Date().toISOString()
      });
      const now = new Date();

      if (!resetToken) {
        console.log('[Password Reset] Token not found in reset request');
        return res.status(400).json({
          error: "Invalid reset token"
        });
      }

      if (resetToken.expires < now) {
        await deleteResetToken(decodedToken);
        console.log('[Password Reset] Expired token in reset request');
        return res.status(400).json({
          error: "Reset token has expired",
          expired: true
        });
      }

      // Hash the new password
      const hashedPassword = await crypto.hash(newPassword);

      // Get user data
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, resetToken.user_id))
        .limit(1);

      if (!user) {
        console.log('[Password Reset] User not found for token:', decodedToken.substring(0, 8));
        return res.status(400).json({
          error: "User not found"
        });
      }

      // Update user's password
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));

      // Remove used token
      await deleteResetToken(decodedToken);

      console.log('[Password Reset] Password reset successful for user:', user.id);
      res.json({ 
        message: "Password has been reset successfully",
        success: true
      });
    } catch (error) {
      console.error('[Password Reset] Reset error:', error);
      res.status(500).json({
        error: "Failed to reset password. Please try again later."
      });
    }
  });
  // Google OAuth routes
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
      // Successful authentication, redirect home
      res.redirect('/');
    }
  );

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("Not logged in");
  });
}
