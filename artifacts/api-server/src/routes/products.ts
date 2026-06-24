import { Router, type IRouter } from "express";
import { eq, like, and, gte, lte, desc, sql, inArray } from "drizzle-orm";
import { db, productsTable, categoriesTable, reviewsTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
  CreateProductBody,
  UpdateProductBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildProductResponse(product: any, category: any, reviewData: any) {
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: parseFloat(product.price),
    comparePrice: product.comparePrice ? parseFloat(product.comparePrice) : null,
    images: product.images || [],
    categoryId: product.categoryId,
    categoryName: category?.name ?? null,
    sizes: product.sizes || [],
    colors: product.colors || [],
    stock: product.stock,
    inStock: product.stock > 0,
    badge: product.badge,
    sku: product.sku,
    rating: reviewData?.avgRating ? parseFloat(reviewData.avgRating) : null,
    reviewCount: reviewData?.count ?? 0,
    createdAt: product.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, search, badge, minPrice, maxPrice, inStock, sortBy, page = 1, limit = 20 } = parsed.data;

  const conditions: any[] = [eq(productsTable.active, true)];
  if (search) conditions.push(like(productsTable.title, `%${search}%`));
  if (badge) conditions.push(eq(productsTable.badge, badge));
  if (minPrice != null) conditions.push(gte(sql`${productsTable.price}::numeric`, minPrice));
  if (maxPrice != null) conditions.push(lte(sql`${productsTable.price}::numeric`, maxPrice));

  let query = db
    .select({
      product: productsTable,
      category: categoriesTable,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id));

  if (category) {
    query = query.where(and(...conditions, eq(categoriesTable.slug, category))) as any;
  } else {
    query = query.where(and(...conditions)) as any;
  }

  if (sortBy === "price_asc") {
    query = query.orderBy(sql`${productsTable.price}::numeric asc`) as any;
  } else if (sortBy === "price_desc") {
    query = query.orderBy(sql`${productsTable.price}::numeric desc`) as any;
  } else {
    query = query.orderBy(desc(productsTable.createdAt)) as any;
  }

  const offset = (page - 1) * limit;
  const rows = await (query as any).limit(limit).offset(offset);

  let filteredRows = rows;
  if (inStock) {
    filteredRows = rows.filter((r: any) => r.product.stock > 0);
  }

  const productIds = filteredRows.map((r: any) => r.product.id);
  let reviewMap: Record<number, { avgRating: string; count: number }> = {};
  if (productIds.length > 0) {
    const reviewData = await db
      .select({
        productId: reviewsTable.productId,
        avgRating: sql<string>`avg(${reviewsTable.rating})`,
        count: sql<number>`count(*)`,
      })
      .from(reviewsTable)
      .where(inArray(reviewsTable.productId, productIds))
      .groupBy(reviewsTable.productId);
    reviewMap = Object.fromEntries(reviewData.map((r) => [r.productId, { avgRating: r.avgRating, count: Number(r.count) }]));
  }

  const products = filteredRows.map((r: any) => buildProductResponse(r.product, r.category, reviewMap[r.product.id]));

  const totalCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(productsTable)
    .where(and(...conditions));

  res.json({
    products,
    total: Number(totalCount[0]?.count ?? 0),
    page,
    limit,
  });
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ product: productsTable, category: categoriesTable })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(and(eq(productsTable.active, true), eq(productsTable.badge, "Best Seller")))
    .orderBy(desc(productsTable.createdAt))
    .limit(8);

  if (rows.length === 0) {
    const fallback = await db
      .select({ product: productsTable, category: categoriesTable })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.active, true))
      .orderBy(desc(productsTable.createdAt))
      .limit(8);
    res.json(fallback.map((r) => buildProductResponse(r.product, r.category, null)));
    return;
  }

  res.json(rows.map((r) => buildProductResponse(r.product, r.category, null)));
});

router.get("/products/new-arrivals", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ product: productsTable, category: categoriesTable })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.active, true))
    .orderBy(desc(productsTable.createdAt))
    .limit(8);

  res.json(rows.map((r) => buildProductResponse(r.product, r.category, null)));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ product: productsTable, category: categoriesTable })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Produsul nu a fost găsit" });
    return;
  }

  const reviewData = await db
    .select({
      avgRating: sql<string>`avg(${reviewsTable.rating})`,
      count: sql<number>`count(*)`,
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.productId, params.data.id));

  res.json(buildProductResponse(row.product, row.category, { avgRating: reviewData[0]?.avgRating, count: Number(reviewData[0]?.count ?? 0) }));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { price, comparePrice, ...rest } = parsed.data;
  const [product] = await db
    .insert(productsTable)
    .values({
      ...rest,
      price: String(price),
      comparePrice: comparePrice != null ? String(comparePrice) : null,
    })
    .returning();

  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));
  res.status(201).json(buildProductResponse(product, category, null));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { price, comparePrice, ...rest } = parsed.data;
  const updates: any = { ...rest };
  if (price != null) updates.price = String(price);
  if (comparePrice !== undefined) updates.comparePrice = comparePrice != null ? String(comparePrice) : null;

  const [product] = await db
    .update(productsTable)
    .set(updates)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Produsul nu a fost găsit" });
    return;
  }

  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));
  res.json(buildProductResponse(product, category, null));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Produsul nu a fost găsit" });
    return;
  }

  res.sendStatus(204);
});

export default router;
