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

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  token: text("token").unique().notNull(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  expires: timestamp("expires").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Color validation schema
export const colorSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
  message: "Invalid hex color format. Must be a valid hex color (e.g., #FF0000 or #F00)",
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

export const insertPaletteSchema = createInsertSchema(palettes).extend({
  name: z.string().min(1, "Name is required"),
  colors: z.array(colorSchema).min(1, "At least one color is required").max(10, "Maximum 10 colors allowed"),
});
export const selectPaletteSchema = createSelectSchema(palettes);
export type InsertPalette = z.infer<typeof insertPaletteSchema>;
export type Palette = z.infer<typeof selectPaletteSchema>;
