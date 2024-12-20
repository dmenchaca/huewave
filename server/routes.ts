import type { Express } from "express";
import { eq, and } from "drizzle-orm";
import { setupAuth } from "./auth";
import { db } from "../db";
import { palettes, insertPaletteSchema } from "../db/schema";
import { z } from "zod";

export function registerRoutes(app: Express) {
  setupAuth(app);

  // Get user's palettes
  app.get("/api/palettes", async (req, res) => {
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
  app.get("/api/palettes/latest", async (req, res) => {
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
  app.post("/api/palettes", async (req, res) => {
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
  app.delete("/api/palettes/:id", async (req, res) => {
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
  app.put("/api/palettes/:id", async (req, res) => {
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

      // First verify the palette exists and belongs to the user
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

      // Update the palette with validated data
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
}

export function registerStorePaletteRoute(app: Express) {
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
    
    // Save session explicitly to ensure palette is stored
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
