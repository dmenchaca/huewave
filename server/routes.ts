
import express from "express";
import { eq, and } from "drizzle-orm";
import { setupAuth } from "./auth";
import { db } from "../db";
import { palettes, insertPaletteSchema, users } from "../db/schema";
import { z } from "zod";
import { generateConfirmationCode, sendConfirmationEmail } from "./email";
import bcrypt from "bcrypt";

const router = express.Router();

export function registerRoutes(app: express.Express) {
  setupAuth(app);

  // Get user's palettes
  router.get("/palettes", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const userPalettes = await db.query.palettes.findMany({
        where: eq(palettes.user_id, req.user.id),
        orderBy: (palettes, { desc }) => [desc(palettes.created_at)],
      });
      res.json(userPalettes);
    } catch (error: unknown) {
      console.error('Error fetching palettes:', error);
      res.status(500).send("Failed to fetch palettes");
    }
  });

  // Get user's latest palette
  router.get("/palettes/latest", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [latestPalette] = await db.query.palettes.findMany({
        where: eq(palettes.user_id, req.user.id),
        orderBy: (palettes, { desc }) => [desc(palettes.created_at)],
        limit: 1,
      });
      
      if (!latestPalette) {
        return res.status(404).send("No palettes found");
      }
      
      res.json(latestPalette);
    } catch (error: unknown) {
      console.error('Error fetching latest palette:', error);
      res.status(500).send("Failed to fetch latest palette");
    }
  });

  // Save a new palette
  router.post("/palettes", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const result = insertPaletteSchema.safeParse({
        ...req.body,
        user_id: req.user.id
      });

      if (!result.success) {
        return res.status(400).json({
          error: "Invalid palette data",
          details: result.error.errors.map((err: z.ZodError["errors"][0]) => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const [palette] = await db
        .insert(palettes)
        .values(result.data)
        .returning();
      res.json(palette);
    } catch (error: unknown) {
      console.error('Error saving palette:', error);
      res.status(500).send("Failed to save palette");
    }
  });

  // Delete a palette
  router.delete("/palettes/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const { id } = req.params;
    try {
      await db
        .delete(palettes)
        .where(
          and(
            eq(palettes.id, parseInt(id)),
            eq(palettes.user_id, req.user.id)
          )
        );
      res.status(200).send("Palette deleted");
    } catch (error: unknown) {
      console.error('Error deleting palette:', error);
      res.status(500).send("Failed to delete palette");
    }
  });

  // Update a palette
  router.put("/palettes/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const { id } = req.params;
    try {
      const result = insertPaletteSchema.safeParse({
        ...req.body,
        user_id: req.user.id
      });

      if (!result.success) {
        return res.status(400).json({
          error: "Invalid palette data",
          details: result.error.errors.map((err: z.ZodError["errors"][0]) => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const [existingPalette] = await db
        .select()
        .from(palettes)
        .where(
          and(
            eq(palettes.id, parseInt(id)),
            eq(palettes.user_id, req.user.id)
          )
        )
        .limit(1);

      if (!existingPalette) {
        return res.status(404).send("Palette not found");
      }

      const [updatedPalette] = await db
        .update(palettes)
        .set({
          name: result.data.name,
          colors: result.data.colors
        })
        .where(
          and(
            eq(palettes.id, parseInt(id)),
            eq(palettes.user_id, req.user.id)
          )
        )
        .returning();
      
      res.json(updatedPalette);
    } catch (error: unknown) {
      console.error('Error updating palette:', error);
      res.status(500).send("Failed to update palette");
    }
  });

  // Email verification endpoint
  router.post('/auth/verify-email', async (req, res) => {
    try {
      const { email, code } = req.body;
      
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (!user || user.confirmationCode !== code || !user.confirmationExpiry || new Date() > user.confirmationExpiry) {
        return res.status(400).json({ error: 'Invalid or expired confirmation code' });
      }

      await db.update(users)
        .set({ 
          emailConfirmed: true,
          confirmationCode: null,
          confirmationExpiry: null 
        })
        .where(eq(users.id, user.id));

      res.json({ message: 'Email confirmed successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify email' });
    }
  });

  // Resend confirmation code endpoint
  router.post('/auth/resend-code', async (req, res) => {
    try {
      const { email } = req.body;
      
      const code = generateConfirmationCode();
      const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await db.update(users)
        .set({ 
          confirmationCode: code,
          confirmationExpiry: expiry 
        })
        .where(eq(users.email, email));

      await sendConfirmationEmail(email, code);
      res.json({ message: 'New confirmation code sent' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to resend confirmation code' });
    }
  });

  // Register endpoint with email confirmation
  router.post('/auth/register', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const code = generateConfirmationCode();
      const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await db.insert(users).values({
        email,
        password: hashedPassword,
        confirmationCode: code,
        confirmationExpiry: expiry,
      });

      await sendConfirmationEmail(email, code);
      res.json({ message: 'Registration successful. Check your email for confirmation.' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  return router;
}

export function registerStorePaletteRoute(app: express.Express) {
  // Store palette in session
  app.post("/api/store-palette", (req, res) => {
    console.log('\n[Store Palette Request]', new Date().toISOString());
    console.log('Session ID:', req.sessionID);
    console.log('Request Body:', req.body);
    
    const { name, colors } = req.body;
    if (!name || !colors) {
      console.log('Invalid palette data received');
      return res.status(400).json({ message: "Invalid palette data" });
    }
    
    req.session.palette = { name, colors };
    
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session with palette:', err);
        return res.status(500).json({ message: "Failed to store palette" });
      }
      
      console.log('Session saved with palette:', {
        sessionId: req.sessionID,
        palette: req.session.palette,
        user: req.session.passport?.user
      });
      
      res.json({ message: "Palette stored in session" });
    });
  });

  // Get stored palette from session
  app.get("/api/palettes/stored", (req, res) => {
    console.log('\n[Stored Palette Request]', new Date().toISOString());
    console.log('Session ID:', req.sessionID);
    console.log('Full Session Data:', {
      palette: req.session.palette,
      user: req.session.passport?.user,
      cookie: req.session.cookie
    });
    
    const palette = req.session.palette;
    if (!palette) {
      console.log('No palette found in session');
      return res.json(null);
    }
    
    console.log('Found palette in session:', palette);
    res.json(palette);
  });

  // Clear stored palette from session
  app.post("/api/clear-stored-palette", (req, res) => {
    console.log('Clearing palette from session');
    const oldPalette = req.session.palette;
    delete req.session.palette;
    console.log('Previous palette:', oldPalette);
    console.log('Session palette after clearing:', req.session.palette);
    res.json({ message: "Stored palette cleared" });
  });
}
