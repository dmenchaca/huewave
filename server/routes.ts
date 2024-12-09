import type { Express } from "express";
import { eq, and } from "drizzle-orm";
import { setupAuth } from "./auth";
import { db } from "../db";
import { palettes } from "@db/schema";

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
    } catch (error) {
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
    } catch (error) {
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
          details: result.error.errors.map(err => ({
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
    } catch (error) {
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
          eq(palettes.id, parseInt(id)) && 
          eq(palettes.user_id, req.user.id)
        );
      res.status(200).send("Palette deleted");
    } catch (error) {
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
          details: result.error.errors.map(err => ({
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
    } catch (error) {
      console.error('Error updating palette:', error);
      res.status(500).send("Failed to update palette");
    }
  });
}

export function registerStorePaletteRoute(app: Express) {
  // Store palette in session
  app.post("/api/store-palette", (req, res) => {
    const { name, colors } = req.body;
    req.session.palette = { name, colors };
    res.json({ message: "Palette stored in session" });
  });
}

