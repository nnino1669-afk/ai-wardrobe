import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, tryOns, InsertTryOn, TryOn, garments, Garment, garmentCategories, GarmentCategory, wishlists } from "../drizzle/schema";
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
    console.warn("[Database] Cannot upsert user: database not available");
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
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
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
    console.warn("[Database] Cannot create try-on: database not available");
    return null;
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
    console.warn("[Database] Cannot get try-ons: database not available");
    return [];
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
export async function getGarments(categoryId?: number, clothType?: string): Promise<Garment[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get garments: database not available");
    return [];
  }

  try {
    let query: any = db.select().from(garments).where(eq(garments.isActive, 1));
    
    if (categoryId) {
      query = query.where(eq(garments.categoryId, categoryId));
    }
    
    if (clothType) {
      query = query.where(eq(garments.clothType, clothType as any));
    }
    
    const result = await query;
    return result;
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
