import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, reviewsTable, productsTable } from "@workspace/db";
import { ListProductReviewsParams, CreateReviewParams, CreateReviewBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products/:id/reviews", async (req, res): Promise<void> => {
  const params = ListProductReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.productId, params.data.id))
    .orderBy(reviewsTable.createdAt);

  res.json(
    reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      reviewerName: r.reviewerName,
      rating: r.rating,
      comment: r.comment,
      verified: r.verified,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/products/:id/reviews", async (req, res): Promise<void> => {
  const params = CreateReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      productId: params.data.id,
      reviewerName: parsed.data.reviewerName,
      reviewerEmail: parsed.data.reviewerEmail,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    })
    .returning();

  res.status(201).json({
    id: review.id,
    productId: review.productId,
    reviewerName: review.reviewerName,
    rating: review.rating,
    comment: review.comment,
    verified: review.verified,
    createdAt: review.createdAt.toISOString(),
  });
});

export default router;
