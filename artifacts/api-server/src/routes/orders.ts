import { Router, type IRouter } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, cartItemsTable, productsTable } from "@workspace/db";
import {
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  ListOrdersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildOrderResponse(order: any) {
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));

  return {
    id: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddress: order.shippingAddress,
    city: order.city,
    county: order.county,
    postalCode: order.postalCode,
    total: parseFloat(order.total),
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    netopiaOrderId: order.netopiaOrderId,
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productTitle: i.productTitle,
      productImage: i.productImage,
      price: parseFloat(i.price),
      quantity: i.quantity,
      size: i.size,
    })),
    createdAt: order.createdAt.toISOString(),
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  let q = db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)) as any;
  if (status) q = q.where(eq(ordersTable.status, status));

  const orders = await q.limit(limit).offset(offset);
  const totalRes = await db.select({ count: sql<number>`count(*)` }).from(ordersTable);

  const ordersWithItems = await Promise.all(orders.map(buildOrderResponse));

  res.json({
    orders: ordersWithItems,
    total: Number(totalRes[0]?.count ?? 0),
    page,
    limit,
  });
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sessionId, ...orderData } = parsed.data;

  // Fetch cart items
  const cartItems = await db
    .select({ cartItem: cartItemsTable, product: productsTable })
    .from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.sessionId, sessionId));

  if (cartItems.length === 0) {
    res.status(400).json({ error: "Coșul este gol" });
    return;
  }

  const total = cartItems.reduce(
    (sum, r) => sum + parseFloat(r.cartItem.price) * r.cartItem.quantity,
    0
  );

  const netopiaOrderId = `ANK-${Date.now()}`;

  const [order] = await db
    .insert(ordersTable)
    .values({
      ...orderData,
      sessionId,
      total: String(Math.round(total * 100) / 100),
      netopiaOrderId,
      paymentMethod: "card",
    })
    .returning();

  // Insert order items
  await db.insert(orderItemsTable).values(
    cartItems.map((r) => ({
      orderId: order.id,
      productId: r.cartItem.productId,
      productTitle: r.product?.title ?? "Unknown",
      productImage: r.product?.images?.[0] ?? null,
      price: r.cartItem.price,
      quantity: r.cartItem.quantity,
      size: r.cartItem.size,
    }))
  );

  // Clear cart
  await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));

  // Build Netopia sandbox form data
  const netopiaFormData: Record<string, string> = {
    env_key: "sandbox-env-key",
    data: Buffer.from(
      JSON.stringify({
        order_id: netopiaOrderId,
        amount: total.toFixed(2),
        currency: "RON",
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail,
      })
    ).toString("base64"),
  };

  res.status(201).json({
    orderId: order.id,
    paymentUrl: "https://sandboxsecure.mobilpay.ro",
    netopiaFormData,
  });
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Comanda nu a fost găsită" });
    return;
  }

  res.json(await buildOrderResponse(order));
});

router.patch("/orders/:id/status", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Comanda nu a fost găsită" });
    return;
  }

  res.json(await buildOrderResponse(order));
});

// Netopia IPN callback
router.post("/payments/netopia/callback", async (req, res): Promise<void> => {
  const { env_key, data } = req.body;
  if (!env_key || !data) {
    res.status(400).send("<?xml version='1.0' encoding='utf-8'?><crc error_type='1' error_code='1'>Invalid request</crc>");
    return;
  }

  try {
    const decoded = JSON.parse(Buffer.from(data, "base64").toString());
    const orderId = decoded.order_id;

    if (orderId) {
      await db
        .update(ordersTable)
        .set({ paymentStatus: "paid", status: "confirmed" })
        .where(eq(ordersTable.netopiaOrderId, orderId));
    }

    res.set("Content-Type", "text/xml");
    res.send("<?xml version='1.0' encoding='utf-8'?><crc></crc>");
  } catch {
    res.set("Content-Type", "text/xml");
    res.send("<?xml version='1.0' encoding='utf-8'?><crc error_type='1' error_code='1'>Error</crc>");
  }
});

export default router;
