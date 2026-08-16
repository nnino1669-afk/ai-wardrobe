import { asc, eq, desc, and, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, tryOns, InsertTryOn, TryOn, garments, Garment, InsertGarment, garmentCategories, GarmentCategory, wishlists, outfits, Outfit, InsertOutfit, garmentReviews, GarmentReview, styleProfiles, StyleProfile } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    const { localDb } = await import("./localDb");
    localDb.upsertUser(user);
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    const { localDb } = await import("./localDb");
    return localDb.getUserByOpenId(openId);
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new try-on record
 */
export async function createTryOn(data: InsertTryOn): Promise<TryOn | null> {
  const db = await getDb();
  if (!db) {
    const { localDb } = await import("./localDb");
    return localDb.createTryOn(data) as TryOn;
  }

  try {
    const result = await db.insert(tryOns).values(data);
    if (result[0]?.insertId) {
      const created = await db.select().from(tryOns).where(eq(tryOns.id, result[0].insertId)).limit(1);
      return created.length > 0 ? created[0] : null;
    }
    return null;
  } catch (error) {
    console.error("[Database] Failed to create try-on:", error);
    throw error;
  }
}

/**
 * Get all try-ons for a user, ordered by creation date (newest first)
 */
export async function getUserTryOns(userId: number, limit: number = 50, offset: number = 0): Promise<TryOn[]> {
  const db = await getDb();
  if (!db) {
    const { localDb } = await import("./localDb");
    return localDb.getTryOns(userId) as TryOn[];
  }

  try {
    const result = await db
      .select()
      .from(tryOns)
      .where(eq(tryOns.userId, userId))
      .orderBy(desc(tryOns.createdAt))
      .limit(limit)
      .offset(offset);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get try-ons:", error);
    throw error;
  }
}

/**
 * Get a single try-on by ID
 */
export async function getTryOnById(id: number): Promise<TryOn | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get try-on: database not available");
    return null;
  }

  try {
    const result = await db.select().from(tryOns).where(eq(tryOns.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get try-on:", error);
    throw error;
  }
}

/**
 * Delete a try-on record
 */
export async function deleteTryOn(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete try-on: database not available");
    return false;
  }

  try {
    await db.delete(tryOns).where(eq(tryOns.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete try-on:", error);
    throw error;
  }
}


/**
 * Get all garment categories
 */
export async function getGarmentCategories(): Promise<GarmentCategory[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get categories: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(garmentCategories)
      .orderBy(garmentCategories.displayOrder);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get categories:", error);
    throw error;
  }
}

/**
 * Get all active garments, optionally filtered by category and cloth type
 */
export type GarmentSort = "newest" | "priceAsc" | "priceDesc" | "popularity";

export async function getAdminGarments(): Promise<Garment[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(garments).orderBy(desc(garments.updatedAt));
}

export async function createCatalogGarment(data: InsertGarment): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.insert(garments).values(data);
  return true;
}

export async function updateCatalogGarment(id: number, data: Partial<InsertGarment>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.update(garments).set(data).where(eq(garments.id, id));
  return true;
}

export async function getAdminAnalytics() {
  const db = await getDb();
  if (!db) return { activeGarments: 0, categories: 0, tryOns: 0, users: 0 };
  const [activeGarments, categories, tryOnCount, userCount] = await Promise.all([
    db.select({ value: count() }).from(garments).where(eq(garments.isActive, 1)),
    db.select({ value: count() }).from(garmentCategories),
    db.select({ value: count() }).from(tryOns),
    db.select({ value: count() }).from(users),
  ]);
  return {
    activeGarments: Number(activeGarments[0]?.value ?? 0),
    categories: Number(categories[0]?.value ?? 0),
    tryOns: Number(tryOnCount[0]?.value ?? 0),
    users: Number(userCount[0]?.value ?? 0),
  };
}

export async function getGarments(
  categoryId?: number,
  clothType?: string,
  sort: GarmentSort = "newest",
): Promise<Garment[]> {
  const db = await getDb();
  if (!db) {
    const { localDb } = await import("./localDb");
    return localDb.getGarments() as Garment[];
  }

  try {
    const conditions = [eq(garments.isActive, 1)];

    if (categoryId !== undefined) {
      conditions.push(eq(garments.categoryId, categoryId));
    }

    if (clothType) {
      conditions.push(eq(garments.clothType, clothType as Garment["clothType"]));
    }

    const ordering = sort === "priceAsc"
      ? [asc(garments.price), desc(garments.createdAt)]
      : sort === "priceDesc"
        ? [desc(garments.price), desc(garments.createdAt)]
        : sort === "popularity"
          ? [desc(garments.rating), desc(garments.reviewCount), desc(garments.createdAt)]
          : [desc(garments.createdAt)];

    return await db
      .select()
      .from(garments)
      .where(and(...conditions))
      .orderBy(...ordering);
  } catch (error) {
    console.error("[Database] Failed to get garments:", error);
    throw error;
  }
}

/**
 * Get a single garment by ID
 */
export async function getGarmentById(id: number): Promise<Garment | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get garment: database not available");
    return null;
  }

  try {
    const result = await db.select().from(garments).where(eq(garments.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get garment:", error);
    throw error;
  }
}

/**
 * Add garment to user's wishlist
 */
export async function getGarmentReviews(garmentId: number): Promise<Pick<GarmentReview, "id" | "rating" | "review" | "createdAt">[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({ id: garmentReviews.id, rating: garmentReviews.rating, review: garmentReviews.review, createdAt: garmentReviews.createdAt })
    .from(garmentReviews)
    .where(eq(garmentReviews.garmentId, garmentId))
    .orderBy(desc(garmentReviews.createdAt));
}

export async function saveGarmentReview(
  userId: number,
  garmentId: number,
  rating: number,
  review?: string,
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const garment = await getGarmentById(garmentId);
  if (!garment) return false;

  await db.delete(garmentReviews).where(and(eq(garmentReviews.userId, userId), eq(garmentReviews.garmentId, garmentId)));
  await db.insert(garmentReviews).values({ userId, garmentId, rating, review: review || null });

  const reviews = await db.select({ rating: garmentReviews.rating }).from(garmentReviews).where(eq(garmentReviews.garmentId, garmentId));
  const average = reviews.length > 0 ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length : 0;
  await db.update(garments).set({ rating: Math.round(average * 100), reviewCount: reviews.length }).where(eq(garments.id, garmentId));
  return true;
}

type StyleProfileValues = {
  preferredColor: string;
  preferredFit: StyleProfile["preferredFit"];
  preferredOccasion: StyleProfile["preferredOccasion"];
};

export async function getStyleProfile(userId: number): Promise<StyleProfileValues> {
  const db = await getDb();
  if (!db) return { preferredColor: "", preferredFit: "regular", preferredOccasion: "everyday" };
  const rows = await db.select({ preferredColor: styleProfiles.preferredColor, preferredFit: styleProfiles.preferredFit, preferredOccasion: styleProfiles.preferredOccasion }).from(styleProfiles).where(eq(styleProfiles.userId, userId)).limit(1);
  const row = rows[0];
  return {
    preferredColor: row?.preferredColor ?? "",
    preferredFit: row?.preferredFit ?? "regular",
    preferredOccasion: row?.preferredOccasion ?? "everyday",
  };
}

export async function saveStyleProfile(
  userId: number,
  profile: StyleProfileValues,
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.insert(styleProfiles).values({ userId, ...profile }).onDuplicateKeyUpdate({ set: profile });
  return true;
}

export async function addToWishlist(userId: number, garmentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add to wishlist: database not available");
    return false;
  }

  try {
    await db.insert(wishlists).values({ userId, garmentId });
    return true;
  } catch (error) {
    console.error("[Database] Failed to add to wishlist:", error);
    throw error;
  }
}

/**
 * Remove garment from user's wishlist
 */
export async function removeFromWishlist(userId: number, garmentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot remove from wishlist: database not available");
    return false;
  }

  try {
    await db.delete(wishlists).where(and(eq(wishlists.userId, userId), eq(wishlists.garmentId, garmentId)));
    return true;
  } catch (error) {
    console.error("[Database] Failed to remove from wishlist:", error);
    throw error;
  }
}

/**
 * Get user's wishlist
 */
export async function getUserWishlist(userId: number): Promise<Garment[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get wishlist: database not available");
    return [];
  }

  try {
    const result = await db
      .select({ garment: garments })
      .from(wishlists)
      .innerJoin(garments, eq(wishlists.garmentId, garments.id))
      .where(eq(wishlists.userId, userId));
    return result.map(r => r.garment);
  } catch (error) {
    console.error("[Database] Failed to get wishlist:", error);
    throw error;
  }
}


export async function createOutfit(outfit: InsertOutfit): Promise<Outfit | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(outfits).values(outfit);
  const result = await db
    .select()
    .from(outfits)
    .where(and(eq(outfits.userId, outfit.userId), eq(outfits.name, outfit.name)))
    .orderBy(desc(outfits.createdAt))
    .limit(1);

  return result[0] ?? null;
}

export async function getUserOutfits(userId: number): Promise<Outfit[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(outfits)
    .where(eq(outfits.userId, userId))
    .orderBy(desc(outfits.createdAt));
}

export async function deleteOutfit(outfitId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const owned = await db
    .select({ id: outfits.id })
    .from(outfits)
    .where(and(eq(outfits.id, outfitId), eq(outfits.userId, userId)))
    .limit(1);
  if (owned.length === 0) return false;

  await db.delete(outfits).where(eq(outfits.id, outfitId));
  return true;
}
