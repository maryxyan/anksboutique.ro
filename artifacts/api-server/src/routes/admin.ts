import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable, categoriesTable } from "@workspace/db";
import { eq, desc, sql, gte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalOrdersRes] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable);
  const [totalRevenueRes] = await db.select({ sum: sql<string>`coalesce(sum(total::numeric), 0)` }).from(ordersTable).where(eq(ordersTable.paymentStatus, "paid"));
  const [totalProductsRes] = await db.select({ count: sql<number>`count(*)` }).from(productsTable);
  const [pendingOrdersRes] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(eq(ordersTable.status, "pending"));
  const [todayOrdersRes] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(gte(ordersTable.createdAt, today));
  const [todayRevenueRes] = await db.select({ sum: sql<string>`coalesce(sum(total::numeric), 0)` }).from(ordersTable).where(gte(ordersTable.createdAt, today));
  const [lowStockRes] = await db.select({ count: sql<number>`count(*)` }).from(productsTable).where(sql`${productsTable.stock} <= 5`);

  const recentOrders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(5);

  res.json({
    totalOrders: Number(totalOrdersRes?.count ?? 0),
    totalRevenue: parseFloat(totalRevenueRes?.sum ?? "0"),
    totalProducts: Number(totalProductsRes?.count ?? 0),
    pendingOrders: Number(pendingOrdersRes?.count ?? 0),
    todayOrders: Number(todayOrdersRes?.count ?? 0),
    todayRevenue: parseFloat(todayRevenueRes?.sum ?? "0"),
    lowStockProducts: Number(lowStockRes?.count ?? 0),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      shippingAddress: o.shippingAddress,
      city: o.city,
      county: o.county,
      postalCode: o.postalCode,
      total: parseFloat(o.total),
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      netopiaOrderId: o.netopiaOrderId,
      items: [],
      createdAt: o.createdAt.toISOString(),
    })),
  });
});

router.get("/admin/inventory", async (_req, res): Promise<void> => {
  const products = await db
    .select({ product: productsTable, category: categoriesTable })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .orderBy(productsTable.title);

  res.json(
    products.map((r) => ({
      id: r.product.id,
      title: r.product.title,
      sku: r.product.sku,
      stock: r.product.stock,
      price: parseFloat(r.product.price),
      categoryName: r.category?.name ?? null,
      badge: r.product.badge,
      images: r.product.images,
    }))
  );
});

export default router;
