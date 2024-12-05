import type { Express } from "express";
import { eq, and } from "drizzle-orm";
import { setupAuth } from "./auth";
import { db } from "../db";
import { palettes } from "@db/schema";

export function registerRoutes(app: Express) {
  setupAuth(app);

  // Generate new palette - no authentication required
  app.post("/api/palettes/generate", async (req, res) => {
    try {
      // Return success response - actual palette generation happens client-side
      res.json({ success: true });
    } catch (error) {
      res.status(500).send("Failed to generate palette");
    }
  });

  // Get user's palettes - requires authentication
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

  // Get a single palette - no authentication required
  app.get("/api/palettes/:id", async (req, res) => {
    try {
      const [palette] = await db
        .select()
        .from(palettes)
        .where(eq(palettes.id, parseInt(req.params.id)))
        .limit(1);

      if (!palette) {
        return res.status(404).send("Palette not found");
      }

      res.json(palette);
    } catch (error) {
      res.status(500).send("Failed to fetch palette");
    }
  });

  // Save a new palette
  app.post("/api/palettes", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const { name, colors } = req.body;
    if (!name || !colors || !Array.isArray(colors)) {
      return res.status(400).send("Invalid palette data");
    }

    try {
      const [palette] = await db
        .insert(palettes)
        .values({
          user_id: req.user.id,
          name,
          colors,
        })
        .returning();
      res.json(palette);
    } catch (error) {
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
    const { name, colors } = req.body;
    
    if (!name || !colors || !Array.isArray(colors)) {
      return res.status(400).send("Invalid palette data");
    }

    try {
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

      // Update the palette
      const [updatedPalette] = await db
        .update(palettes)
        .set({ name, colors })
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
