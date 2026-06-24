import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, cartItemsTable, productsTable } from "@workspace/db";
import {
  GetCartQueryParams,
  AddToCartBody,
  UpdateCartItemParams,
  UpdateCartItemBody,
  RemoveCartItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildCart(sessionId: string) {
  const items = await db
    .select({ cartItem: cartItemsTable, product: productsTable })
    .from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.sessionId, sessionId));

  const cartItems = items.map((row) => ({
    id: row.cartItem.id,
    productId: row.cartItem.productId,
    productTitle: row.product?.title ?? "Produs necunoscut",
    productImage: row.product?.images?.[0] ?? null,
    price: parseFloat(row.cartItem.price),
    quantity: row.cartItem.quantity,
    size: row.cartItem.size,
    color: row.cartItem.color,
  }));

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    sessionId,
    items: cartItems,
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(subtotal * 100) / 100,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
  };
}

router.get("/cart", async (req, res): Promise<void> => {
  const parsed = GetCartQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const cart = await buildCart(parsed.data.sessionId);
  res.json(cart);
});

router.post("/cart/items", async (req, res): Promise<void> => {
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sessionId, productId, quantity, size, color } = parsed.data;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) {
    res.status(404).json({ error: "Produsul nu a fost găsit" });
    return;
  }

  // Check if same product+size+color already in cart
  const [existing] = await db
    .select()
    .from(cartItemsTable)
    .where(
      and(
        eq(cartItemsTable.sessionId, sessionId),
        eq(cartItemsTable.productId, productId),
        size ? eq(cartItemsTable.size, size) : eq(cartItemsTable.size, ""),
        color ? eq(cartItemsTable.color, color) : eq(cartItemsTable.color, "")
      )
    );

  if (existing) {
    await db
      .update(cartItemsTable)
      .set({ quantity: existing.quantity + quantity })
      .where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({
      sessionId,
      productId,
      quantity,
      size: size ?? null,
      color: color ?? null,
      price: product.price,
    });
  }

  const cart = await buildCart(sessionId);
  res.status(201).json(cart);
});

router.patch("/cart/items/:itemId", async (req, res): Promise<void> => {
  const params = UpdateCartItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db
    .update(cartItemsTable)
    .set({ quantity: parsed.data.quantity })
    .where(eq(cartItemsTable.id, params.data.itemId))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Produsul din coș nu a fost găsit" });
    return;
  }

  const cart = await buildCart(item.sessionId);
  res.json(cart);
});

router.delete("/cart/items/:itemId", async (req, res): Promise<void> => {
  const params = RemoveCartItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db
    .delete(cartItemsTable)
    .where(eq(cartItemsTable.id, params.data.itemId))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Produsul din coș nu a fost găsit" });
    return;
  }

  const cart = await buildCart(item.sessionId);
  res.json(cart);
});

export default router;
