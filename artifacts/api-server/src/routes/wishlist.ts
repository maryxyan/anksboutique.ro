import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, wishlistItemsTable, productsTable, categoriesTable, reviewsTable } from "@workspace/db";
import { GetWishlistQueryParams, ToggleWishlistBody } from "@workspace/api-zod";
import { sql, inArray } from "drizzle-orm";

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
    stock: product.stock,
    inStock: product.stock > 0,
    badge: product.badge,
    sku: product.sku,
    rating: reviewData?.avgRating ? parseFloat(reviewData.avgRating) : null,
    reviewCount: reviewData?.count ?? 0,
    createdAt: product.createdAt.toISOString(),
  };
}

router.get("/wishlist", async (req, res): Promise<void> => {
  const parsed = GetWishlistQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const items = await db
    .select({ wishlistItem: wishlistItemsTable, product: productsTable, category: categoriesTable })
    .from(wishlistItemsTable)
    .leftJoin(productsTable, eq(wishlistItemsTable.productId, productsTable.id))
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(wishlistItemsTable.sessionId, parsed.data.sessionId));

  const productIds = items.filter((r) => r.product).map((r) => r.product!.id);
  let reviewMap: Record<number, any> = {};
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
    reviewMap = Object.fromEntries(reviewData.map((r) => [r.productId, r]));
  }

  const result = items
    .filter((r) => r.product)
    .map((r) => ({
      id: r.wishlistItem.id,
      productId: r.wishlistItem.productId,
      product: buildProductResponse(r.product!, r.category, reviewMap[r.product!.id]),
    }));

  res.json(result);
});

router.post("/wishlist/toggle", async (req, res): Promise<void> => {
  const parsed = ToggleWishlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sessionId, productId } = parsed.data;

  const [existing] = await db
    .select()
    .from(wishlistItemsTable)
    .where(and(eq(wishlistItemsTable.sessionId, sessionId), eq(wishlistItemsTable.productId, productId)));

  if (existing) {
    await db.delete(wishlistItemsTable).where(eq(wishlistItemsTable.id, existing.id));
    res.json({ added: false, productId });
  } else {
    await db.insert(wishlistItemsTable).values({ sessionId, productId });
    res.json({ added: true, productId });
  }
});

export default router;
