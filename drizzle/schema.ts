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

/**
 * Garment categories for organizing the clothing catalog.
 */
export const garmentCategories = mysqlTable("garmentCategories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  displayOrder: int("displayOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GarmentCategory = typeof garmentCategories.$inferSelect;
export type InsertGarmentCategory = typeof garmentCategories.$inferInsert;

/**
 * Clothing catalog table storing all available garments.
 * Each garment has an image URL (S3), metadata, and pricing.
 */
export const garments = mysqlTable("garments", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl").notNull(),
  clothType: mysqlEnum("clothType", ["upper", "lower", "overall", "inner", "outer"]).notNull(),
  color: varchar("color", { length: 50 }),
  sizes: varchar("sizes", { length: 100 }).default("XS,S,M,L,XL,XXL"),
  price: int("price"),
  brand: varchar("brand", { length: 100 }),
  rating: int("rating").default(0),
  reviewCount: int("reviewCount").default(0),
  isActive: int("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Garment = typeof garments.$inferSelect;
export type InsertGarment = typeof garments.$inferInsert;

/**
 * User outfits - combinations of garments saved by users.
 */
export const outfits = mysqlTable("outfits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  garmentIds: text("garmentIds").notNull(),
  previewImageUrl: text("previewImageUrl"),
  rating: int("rating").default(0),
  isPublic: int("isPublic").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Outfit = typeof outfits.$inferSelect;
export type InsertOutfit = typeof outfits.$inferInsert;

/**
 * User wishlist - garments saved for later purchase.
 */
export const wishlists = mysqlTable("wishlists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  garmentId: int("garmentId").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = typeof wishlists.$inferInsert;