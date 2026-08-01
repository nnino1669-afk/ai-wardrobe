import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Try-on history table storing all virtual try-on results.
 * Links to users and stores S3 URLs for images.
 */
export const tryOns = mysqlTable("tryOns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** URL to the original person/group photo (S3) */
  personImageUrl: text("personImageUrl").notNull(),
  /** URL to the original garment photo (S3) */
  garmentImageUrl: text("garmentImageUrl").notNull(),
  /** URL to the generated try-on result (S3) */
  resultImageUrl: text("resultImageUrl").notNull(),
  /** Type of garment: upper, lower, overall, inner, outer */
  clothType: mysqlEnum("clothType", ["upper", "lower", "overall", "inner", "outer"]).notNull(),
  /** Optional: name/description of the try-on */
  name: varchar("name", { length: 255 }),
  /** Optional: for group photos, which person was selected (index or description) */
  personSelector: varchar("personSelector", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TryOn = typeof tryOns.$inferSelect;
export type InsertTryOn = typeof tryOns.$inferInsert;