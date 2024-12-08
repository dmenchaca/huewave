import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  provider: text("provider").default('local'),
  provider_id: text("provider_id"),
});

export const palettes = pgTable("palettes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  colors: jsonb("colors").$type<string[]>().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).extend({
  email: z.string().email("Please enter a valid email address"),
});
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

export const insertPaletteSchema = createInsertSchema(palettes);
export const selectPaletteSchema = createSelectSchema(palettes);
export type InsertPalette = z.infer<typeof insertPaletteSchema>;
export type Palette = z.infer<typeof selectPaletteSchema>;
