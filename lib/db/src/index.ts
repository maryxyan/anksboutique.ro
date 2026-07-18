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

export async function ensureLabelsSeeded() {
  const existing = await db.select().from(schema.labelsTable).limit(1);
  if (existing.length > 0) {
    return;
  }

  await db
    .insert(schema.labelsTable)
    .values([
      {
        name: "New",
        slug: "new",
        description: "Etichetă pentru produse noi",
        sortOrder: 1,
        status: "active",
      },
      {
        name: "Best Seller",
        slug: "best-seller",
        description: "Cele mai vândute produse",
        sortOrder: 2,
        status: "active",
      },
      {
        name: "Limited",
        slug: "limited",
        description: "Colecție limitată",
        sortOrder: 3,
        status: "active",
      },
    ])
    .onConflictDoNothing();
}

export * from "./schema";
