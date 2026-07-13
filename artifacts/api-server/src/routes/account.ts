import { Router, type IRouter } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, categoriesTable, reviewsTable, returnsTable } from "@workspace/db";
import { z } from "zod";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const router: IRouter = Router();

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── GET orders by customer email ───────────────────────────────────────────
router.get("/account/orders", async (req, res): Promise<void> => {
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email-ul este obligatoriu" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.customerEmail, email))
    .orderBy(desc(ordersTable.createdAt));

  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
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
    })
  );

  res.json(ordersWithItems);
});

// ─── GET single order details ───────────────────────────────────────────────
router.get("/account/orders/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID invalid" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) {
    res.status(404).json({ error: "Comanda nu a fost găsită" });
    return;
  }

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));

  res.json({
    id: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddress: order.shippingAddress,
    city: order.city,
    county: order.county,
    postalCode: order.postalCode,
    notes: order.notes,
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
  });
});

// ─── GET reviews by email ───────────────────────────────────────────────────
router.get("/account/reviews", async (req, res): Promise<void> => {
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email-ul este obligatoriu" });
    return;
  }

  const reviews = await db
    .select({
      review: reviewsTable,
      product: productsTable,
    })
    .from(reviewsTable)
    .leftJoin(productsTable, eq(reviewsTable.productId, productsTable.id))
    .where(eq(reviewsTable.reviewerEmail, email))
    .orderBy(desc(reviewsTable.createdAt));

  res.json(
    reviews.map((r) => ({
      id: r.review.id,
      productId: r.review.productId,
      productTitle: r.product?.title ?? null,
      productImage: r.product?.images?.[0] ?? null,
      rating: r.review.rating,
      comment: r.review.comment,
      verified: r.review.verified,
      createdAt: r.review.createdAt.toISOString(),
    }))
  );
});

// ─── POST submit a review ───────────────────────────────────────────────────
const SubmitReviewBody = z.object({
  productId: z.number().positive(),
  reviewerName: z.string().min(1),
  reviewerEmail: z.string().email(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

router.post("/account/reviews", async (req, res): Promise<void> => {
  const parsed = SubmitReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [review] = await db.insert(reviewsTable).values(parsed.data).returning();
  res.status(201).json(review);
});

// ─── GET products purchased by email (for review eligibility) ───────────────
router.get("/account/purchased-products", async (req, res): Promise<void> => {
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email-ul este obligatoriu" });
    return;
  }

  const orders = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.customerEmail, email),
        eq(ordersTable.paymentStatus, "paid")
      )
    );

  if (orders.length === 0) {
    res.json([]);
    return;
  }

  const orderIds = orders.map((o) => o.id);
  const items = await db
    .select({
      productId: orderItemsTable.productId,
      productTitle: orderItemsTable.productTitle,
      productImage: orderItemsTable.productImage,
    })
    .from(orderItemsTable)
    .where(sql`${orderItemsTable.orderId} IN (${sql.join(orderIds, sql`,`)})`)
    .groupBy(
      orderItemsTable.productId,
      orderItemsTable.productTitle,
      orderItemsTable.productImage
    );

  // Check which ones already have reviews
  const reviewed = await db
    .select({ productId: reviewsTable.productId })
    .from(reviewsTable)
    .where(
      and(
        eq(reviewsTable.reviewerEmail, email),
        sql`${reviewsTable.productId} IN (${sql.join(items.map((i) => i.productId), sql`,`)} )`
      )
    );

  const reviewedIds = new Set(reviewed.map((r) => r.productId));

  res.json(
    items.map((i) => ({
      productId: i.productId,
      productTitle: i.productTitle,
      productImage: i.productImage,
      hasReview: reviewedIds.has(i.productId),
    }))
  );
});

// ─── DELETE account (GDPR) ──────────────────────────────────────────────────
router.delete("/account/delete", async (req, res): Promise<void> => {
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email-ul este obligatoriu" });
    return;
  }

  // Get all orders for this email
  const orders = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .where(eq(ordersTable.customerEmail, email));

  // Delete order items for each order
  for (const order of orders) {
    await db.delete(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  }

  // Delete orders
  await db.delete(ordersTable).where(eq(ordersTable.customerEmail, email));

  // Delete reviews
  await db.delete(reviewsTable).where(eq(reviewsTable.reviewerEmail, email));

  res.json({ message: "Contul și toate datele asociate au fost șterse." });
});


// ─── POST submit a return request ──────────────────────────────────────────
const SubmitReturnBody = z.object({
  customerName: z.string().min(1, "Numele este obligatoriu"),
  customerEmail: z.string().email("Email invalid"),
  customerPhone: z.string().min(1, "Telefonul este obligatoriu"),
  orderNumber: z.string().min(1, "Numarul comenzii este obligatoriu"),
  orderDate: z.string().min(1, "Data achizitiei este obligatorie"),
  products: z.array(z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    quantity: z.number().int().positive(),
    reason: z.string().optional(),
  })).min(1, "Cel putin un produs este necesar"),
  returnOption: z.enum(["replace", "refund"]),
  replacementSize: z.string().optional(),
  replacementColor: z.string().optional(),
  accountHolder: z.string().optional(),
  iban: z.string().optional(),
  bank: z.string().optional(),
  notes: z.string().optional(),
});

router.post("/account/returns", async (req, res): Promise<void> => {
  const parsed = SubmitReturnBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [ret] = await db.insert(returnsTable).values(parsed.data).returning();
  res.status(201).json({ message: "Cererea de retur a fost inregistrata cu succes.", returnId: ret.id });
});

// ─── GET returns by email ──────────────────────────────────────────────────
router.get("/account/returns", async (req, res): Promise<void> => {
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email-ul este obligatoriu" });
    return;
  }

  const returns = await db
    .select()
    .from(returnsTable)
    .where(eq(returnsTable.customerEmail, email))
    .orderBy(desc(returnsTable.createdAt));

  res.json(returns.map((r) => ({
    ...r,
    products: r.products as { name: string; sku: string; quantity: number; reason?: string }[],
  })));
});

// ─── Wishlist items for client (GET by email - looks up session) ────────────
// ─── POST forgot password ───────────────────────────────────────────────
router.post("/account/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email-ul este obligatoriu" });
    return;
  }

  // Generate token and store URL
  const token = `demo-token-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const resetLink = `https://anksboutique.ro/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  try {
    // Read HTML template
    const templatePath = path.join(__dirname, "..", "templates", "reset-password.html");
    let html = fs.readFileSync(templatePath, "utf-8");

    // Replace placeholders
    const name = email.split("@")[0]; // extract name from email
    html = html.replace(/\{\{NAME\}\}/g, name);
    html = html.replace(/\{\{RESET_LINK\}\}/g, resetLink);

    // Path to PHP mailer script
    const phpScript = path.join(__dirname, "..", "..", "..", "scripts", "send-mail.php");

    // Write temporary HTML file in OS temp folder for PHP to send
    const tmpFile = path.join(os.tmpdir(), `temp_reset_email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.html`);
    
    try {
      fs.writeFileSync(tmpFile, html, "utf-8");

      // Send via PHP mail()
      await execAsync(
        `php "${phpScript}" --to="${email}" --subject="Resetare Parola - Ank's Boutique" --html-file="${tmpFile}" --from="contact@anksboutique.ro" --fromName="Ank's Boutique"`
      );
    } finally {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }

    console.log(`[PASSWORD RESET] Email sent to ${email}`);
    console.log(`[PASSWORD RESET] Reset link: ${resetLink}`);

    res.json({
      message: "Email trimis cu succes. Verifica inbox-ul (inclusiv spam) pentru link-ul de resetare.",
      debugLink: resetLink,
    });
  } catch (err) {
    console.error(`[PASSWORD RESET] Failed to send email to ${email}:`, err);

    // Even if email fails, still return the debugLink for development
    res.json({
      message: "Email-ul nu a putut fi trimis (verifica configuratia serverului de mail).",
      debugLink: resetLink,
    });
  }
});

// ─── POST reset password ────────────────────────────────────────────────
const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/account/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Date invalide. Verifica token-ul si email-ul." });
    return;
  }

  const { token, email, password } = parsed.data;

  // In production: verify token from DB, check expiry, update password
  // For demo: accept any token that starts with "demo-token-"
  if (!token.startsWith("demo-token-")) {
    res.status(400).json({ error: "Token invalid sau expirat. Solicita un nou link de resetare." });
    return;
  }

  // For localStorage-based auth, we update the users array
  // This is a simulation - in production this would update the DB
  console.log(`[PASSWORD RESET] Password reset for ${email} (simulated)`);

  res.json({
    message: "Parola a fost resetata cu succes. Te poti autentifica cu noua parola.",
  });
});

export default router;
