import { Router, type IRouter } from "express";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { CreateCategoryBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Helper to get category with product count
async function getCategoriesWithCounts() {
  const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);

  return await Promise.all(
    categories.map(async (cat) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(productsTable)
        .where(eq(productsTable.categoryId, cat.id));
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        productCount: Number(count),
      };
    })
  );
}

// Params schema for category ID
const CategoryIdParams = z.object({
  id: z.coerce.number().positive(),
});

// Update body schema (same as create but all optional)
const UpdateCategoryBody = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

router.get("/categories", async (_req, res): Promise<void> => {
  const result = await getCategoriesWithCounts();
  res.json(result);
});

router.get("/categories/:id", async (req, res): Promise<void> => {
  const params = CategoryIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, params.data.id));
  if (!category) {
    res.status(404).json({ error: "Categoria nu a fost găsită" });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(productsTable)
    .where(eq(productsTable.categoryId, category.id));

  res.json({ ...category, productCount: Number(count) });
});

router.post("/categories", async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [category] = await db.insert(categoriesTable).values(parsed.data).returning();
  res.status(201).json({ ...category, productCount: 0 });
});

router.put("/categories/:id", async (req, res): Promise<void> => {
  const params = CategoryIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Categoria nu a fost găsită" });
    return;
  }

  const [updated] = await db
    .update(categoriesTable)
    .set(parsed.data)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(productsTable)
    .where(eq(productsTable.categoryId, updated.id));

  res.json({ ...updated, productCount: Number(count) });
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  const params = CategoryIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Check if category has products
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(productsTable)
    .where(eq(productsTable.categoryId, params.data.id));

  if (Number(count) > 0) {
    res.status(400).json({ error: `Nu se poate șterge categoria. Are ${count} produse asociate.` });
    return;
  }

  const [deleted] = await db
    .delete(categoriesTable)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Categoria nu a fost găsită" });
    return;
  }

  res.sendStatus(204);
});

export default router;
