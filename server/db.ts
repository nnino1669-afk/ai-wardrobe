import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, tryOns, InsertTryOn, TryOn } from "../drizzle/schema";
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
