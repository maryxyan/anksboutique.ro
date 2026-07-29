import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
    const message = err instanceof Error ? err.message : String(err);
    // If table doesn't exist, create it automatically
    if (message.includes("does not exist") || message.includes("relation") || message.includes("not found")) {
      console.log("[DB] Labels table not found - creating it now...");
      await db.execute(`
        CREATE TABLE IF NOT EXISTS labels (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Grant permissions
      try {
        await db.execute(`GRANT ALL PRIVILEGES ON TABLE labels TO anksboutique;`);
        await db.execute(`GRANT USAGE, SELECT ON SEQUENCE labels_id_seq TO anksboutique;`);
      } catch {
        // Permissions may not be needed if already granted
      }

      // Now seed the table
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

      console.log("[DB] Labels table created and seeded successfully!");
    } else {
      // Some other error - log but don't crash the server
      console.error("[DB] Error during labels seeding:", message);
    }
  }
}

export * from "./schema";
