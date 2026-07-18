import { Router, type IRouter } from "express";
import { db, labelsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

// Params schema for label ID
const LabelIdParams = z.object({
  id: z.coerce.number().positive(),
});

// Create body schema
const CreateLabelBody = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  sortOrder: z.number().optional().default(0),
  status: z.string().optional().default("active"),
});

// Update body schema (all optional)
const UpdateLabelBody = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  status: z.string().optional(),
});

// GET all labels
router.get("/labels", async (_req, res): Promise<void> => {
  const labels = await db.select().from(labelsTable).orderBy(asc(labelsTable.sortOrder), asc(labelsTable.createdAt));
  res.json(labels);
});

// GET single label
router.get("/labels/:id", async (req, res): Promise<void> => {
  const params = LabelIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [label] = await db.select().from(labelsTable).where(eq(labelsTable.id, params.data.id));
  if (!label) {
    res.status(404).json({ error: "Eticheta nu a fost găsită" });
    return;
  }

  res.json(label);
});

// POST create label
router.post("/labels", async (req, res): Promise<void> => {
  const parsed = CreateLabelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [label] = await db
    .insert(labelsTable)
    .values({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      sortOrder: parsed.data.sortOrder,
      status: parsed.data.status,
    })
    .returning();
  res.status(201).json(label);
});

// PUT update label
router.put("/labels/:id", async (req, res): Promise<void> => {
  const params = LabelIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLabelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(labelsTable).where(eq(labelsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Eticheta nu a fost găsită" });
    return;
  }

  const [updated] = await db
    .update(labelsTable)
    .set({
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.slug !== undefined && { slug: parsed.data.slug }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.sortOrder !== undefined && { sortOrder: parsed.data.sortOrder }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
    })
    .where(eq(labelsTable.id, params.data.id))
    .returning();

  res.json(updated);
});

// DELETE label
router.delete("/labels/:id", async (req, res): Promise<void> => {
  const params = LabelIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db.select().from(labelsTable).where(eq(labelsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Eticheta nu a fost găsită" });
    return;
  }

  await db.delete(labelsTable).where(eq(labelsTable.id, params.data.id));
  res.status(204).send();
});

export default router;
