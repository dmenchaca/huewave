import type { Express } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { palettes } from "@db/schema";
import { eq } from "drizzle-orm";

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
}
