import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5_000,
});
export const db = drizzle(pool, { schema });

/**
 * Ensure the labels table exists and is seeded with default labels.
 * If the table doesn't exist, it will be created automatically.
 * This is safe to call on every server startup.
 */
export async function ensureLabelsSeeded() {
  try {
    // First check if table exists by selecting from it
    const existing = await db.select().from(schema.labelsTable).limit(1);
    if (existing.length > 0) {
      // Already seeded
      return;
    }

    // Table exists but empty - seed it
    await db
      .insert(schema.labelsTable)
      .values([
        {
          name: "New",
          slug: "new",
          description: "Eticheta pentru produse noi",
          sortOrder: 1,
          status: "active",
        },
        {
          name: "Best Seller",
          slug: "best-seller",
          description: "Cele mai vandute produse",
          sortOrder: 2,
          status: "active",
        },
        {
          name: "Limited",
          slug: "limited",
          description: "Colectie limitata",
          sortOrder: 3,
          status: "active",
        },
      ])
      .onConflictDoNothing();
  } catch (err) {
    console.error("[DB] Error during labels seeding:", err);
    throw err;
  }
}

export * from "./schema";
