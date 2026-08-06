import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, desc, gte, sql } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, cartItemsTable, productsTable } from "@workspace/db";
import {
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  ListOrdersQueryParams,
} from "@workspace/api-zod";
import {
  encryptPaymentRequest,
  decryptIpnResponse,
  buildIpnConfirmationXml,
  loadConfigFromEnv,
  createSandboxStubConfig,
} from "../lib/netopia";
import { logger } from "../lib/logger";
import { sendHtmlEmail } from "../lib/mailer";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const router: IRouter = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../../templates");

/**
 * Load the receipt HTML template and replace placeholders with actual values.
 */
function renderReceiptHtml(params: Record<string, string>): string {
  const templatePath = path.join(TEMPLATES_DIR, "receipt.html");
  let html = fs.readFileSync(templatePath, "utf-8");

  for (const [key, value] of Object.entries(params)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
  }

  return html;
}

/**
 * Generate the receipt page HTML for a given order.
 */
async function getReceiptHtml(orderId: number): Promise<string | null> {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));

  const isPaid = order.paymentStatus === "paid";
  const isPending = order.paymentStatus === "pending";
  const isCancelled = order.paymentStatus === "cancelled";

  let statusClass: string;
  let statusIcon: string;
  let statusTitle: string;
  let statusMessage: string;

  if (isPaid) {
    statusClass = "success";
    statusIcon = "&#10003;";
    statusTitle = "Plata a fost confirmat&#259;";
    statusMessage = "Comanda ta a fost plasat&#259; &#351;i este &#238;n curs de procesare. Vei primi un email de confirmare.";
  } else if (isPending) {
    statusClass = "pending";
    statusIcon = "&#8987;";
    statusTitle = "Plat&#259; &#238;n a&#351;teptare";
    statusMessage = "Plata nu a fost &#238;nc&#259; confirmat&#259;. Te rug&#259;m s&#259; a&#351;tep&#355;i sau s&#259; verifici statusul comenzii.";
  } else if (isCancelled) {
    statusClass = "error";
    statusIcon = "&#10007;";
    statusTitle = "Plata a fost anulat&#259;";
    statusMessage = "Nu ai fost taxat&#259;. Po&#355;i reveni &#238;n magazin pentru a plasa din nou comanda.";
  } else {
    statusClass = "error";
    statusIcon = "&#10007;";
    statusTitle = "Plata nu a reu&#351;it";
    statusMessage = "Plata nu a putut fi procesat&#259;. Nu ai fost taxat&#259;. Te rug&#259;m s&#259; &#238;ncerci din nou sau s&#259; folose&#351;ti o alt&#259; metod&#259; de plat&#259;.";
  }

  const paymentStatusLabel = isPaid ? "Pl&#259;tit" : isPending ? "&#206;n a&#351;teptare" : isCancelled ? "Anulat" : "E&#351;uat";

  const orderItemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td>
            <div class="item-title">${escapeHtml(item.productTitle)}</div>
            ${item.size ? `<div class="item-meta">M&#259;rime: ${escapeHtml(item.size)}</div>` : ""}
          </td>
          <td>${item.quantity}</td>
          <td class="item-price">${parseFloat(item.price).toFixed(2)} RON</td>
        </tr>`,
    )
    .join("\n          ");

  const total = parseFloat(order.total);
  const subtotal = total; // Free shipping for now

  const html = renderReceiptHtml({
    STATUS_CLASS: statusClass,
    STATUS_ICON: statusIcon,
    STATUS_TITLE: statusTitle,
    STATUS_MESSAGE: statusMessage,
    ORDER_ID: String(order.id),
    ORDER_DATE: new Date(order.createdAt).toLocaleDateString("ro-RO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    PAYMENT_STATUS: paymentStatusLabel,
    ORDER_ITEMS: orderItemsHtml,
    SUBTOTAL: subtotal.toFixed(2) + " RON",
    SHIPPING_COST: "Gratuit",
    TOTAL: total.toFixed(2) + " RON",
    CUSTOMER_NAME: escapeHtml(order.customerName),
    CUSTOMER_EMAIL: escapeHtml(order.customerEmail),
    CUSTOMER_PHONE: escapeHtml(order.customerPhone ?? ""),
    CUSTOMER_ADDRESS: escapeHtml(order.shippingAddress ?? ""),
    CUSTOMER_CITY: escapeHtml(order.city ?? ""),
    CUSTOMER_COUNTY: escapeHtml(order.county ?? ""),
    CUSTOMER_POSTAL_CODE: escapeHtml(order.postalCode ?? ""),
    SHOP_URL: process.env["FRONTEND_URL"] ?? "https://anksboutique.ro/shop",
    SUPPORT_EMAIL: "contact@anksboutique.ro",
  });

  return html;
}

function escapeHtml(str: string): string {
  const amp = String.fromCharCode(38) + "amp;";
  const lt = String.fromCharCode(38) + "lt;";
  const gt = String.fromCharCode(38) + "gt;";
  const quot = String.fromCharCode(38) + "quot;";
  const apos = String.fromCharCode(38) + "#039;";
  return str
    .replace(/&/g, amp)
    .replace(/</g, lt)
    .replace(/>/g, gt)
    .replace(/"/g, quot)
    .replace(/'/g, apos);
}

function emailShell(title: string, body: string): string {
  return `<!doctype html><html lang="ro"><body style="margin:0;background:#f5f3ef;font-family:Arial,sans-serif;color:#24211d"><div style="max-width:640px;margin:0 auto;padding:32px 20px"><div style="background:#fff;padding:32px;border:1px solid #e8e2da"><h1 style="font-family:Georgia,serif;font-size:26px;font-weight:normal;margin:0 0 24px">${title}</h1>${body}<p style="margin:28px 0 0;color:#716b63;font-size:13px">Ank's Boutique · <a href="mailto:contact@anksboutique.ro">contact@anksboutique.ro</a></p></div></div></body></html>`;
}

async function getOrderEmailDetails(order: typeof ordersTable.$inferSelect) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const itemRows = items.map((item) => `<li>${escapeHtml(item.productTitle)} × ${item.quantity}${item.size ? ` (mărimea ${escapeHtml(item.size)})` : ""} — ${Number(item.price).toFixed(2)} RON</li>`).join("");
  return { items, itemRows };
}

async function sendPaidNotifications(orderId: number): Promise<void> {
  let [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return;
  const { itemRows } = await getOrderEmailDetails(order);

  if (!order.confirmationEmailSentAt) {
    await sendHtmlEmail({
      to: order.customerEmail,
      subject: `Confirmare comandă #${order.id} - Ank's Boutique`,
      html: emailShell("Plata a fost confirmată", `<p>Bună, ${escapeHtml(order.customerName)}!</p><p>Am primit plata pentru comanda <strong>#${order.id}</strong> și am început procesarea ei.</p><ul>${itemRows}</ul><p><strong>Total: ${Number(order.total).toFixed(2)} RON</strong></p><p>Te vom contacta când coletul este pregătit pentru expediere.</p>`),
    });
    await db.update(ordersTable).set({ confirmationEmailSentAt: new Date() }).where(eq(ordersTable.id, order.id));
  }

  [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (order && !order.adminNotificationSentAt) {
    await sendHtmlEmail({
      to: process.env["ADMIN_EMAIL"]?.trim() || "contact@anksboutique.ro",
      subject: `Comandă nouă plătită #${order.id}`,
      html: emailShell("Comandă nouă plătită", `<p><strong>Comanda:</strong> #${order.id}</p><p><strong>Client:</strong> ${escapeHtml(order.customerName)}<br><strong>Email:</strong> ${escapeHtml(order.customerEmail)}<br><strong>Telefon:</strong> ${escapeHtml(order.customerPhone)}</p><ul>${itemRows}</ul><p><strong>Total: ${Number(order.total).toFixed(2)} RON</strong></p><p><strong>Livrare:</strong> ${escapeHtml(order.shippingAddress ?? "")}, ${escapeHtml(order.city ?? "")}, ${escapeHtml(order.county ?? "")}</p>`),
    });
    await db.update(ordersTable).set({ adminNotificationSentAt: new Date() }).where(eq(ordersTable.id, order.id));
  }
}

async function sendUnsuccessfulPaymentEmail(orderId: number, kind: "failed" | "cancelled"): Promise<void> {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return;
  const sentAt = kind === "failed" ? order.failedPaymentEmailSentAt : order.cancelledPaymentEmailSentAt;
  if (sentAt) return;

  const failed = kind === "failed";
  await sendHtmlEmail({
    to: order.customerEmail,
    subject: `${failed ? "Plata nu a reușit" : "Plata a fost anulată"} - comanda #${order.id}`,
    html: emailShell(failed ? "Plata nu a reușit" : "Plata a fost anulată", `<p>Bună, ${escapeHtml(order.customerName)}!</p><p>${failed ? "Plata pentru comanda ta nu a putut fi procesată." : "Ai anulat plata pentru această comandă."}</p><p>Nu ai fost taxată. Poți reveni în magazin pentru a plasa din nou comanda sau ne poți contacta dacă ai nevoie de ajutor.</p><p><a href="${escapeHtml(process.env["FRONTEND_URL"]?.trim() || "https://anksboutique.ro")}/shop">Înapoi în magazin</a></p>`),
  });
  await db.update(ordersTable).set(failed ? { failedPaymentEmailSentAt: new Date() } : { cancelledPaymentEmailSentAt: new Date() }).where(eq(ordersTable.id, order.id));
}

/**
 * Load the Netopia config.
 *
 * In production (`NETOPIA_SANDBOX=false`), failures must be treated as fatal
 * so we do not send stub-style payment payloads to the live Netopia endpoint.
 */
function getNetopiaConfig() {
  try {
    return loadConfigFromEnv();
  } catch (error) {
    logger.error(
      {
        err: error,
      },
      "Failed to load Netopia config",
    );

    if (process.env["NETOPIA_SANDBOX"] === "true") {
      logger.warn(
        {
          err: error,
        },
        "Falling back to sandbox Netopia stub config because NETOPIA_SANDBOX=true",
      );
      return createSandboxStubConfig();
    }

    throw error;
  }
}

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

// ── Routes ───────────────────────────────────────────────────────────────────

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

/**
 * POST /orders — Creates a new order and returns Netopia payment form data.
 *
 * Flow:
 * 1. Validate request body
 * 2. Fetch cart items for session
 * 3. Create order in database
 * 4. Insert order items and clear cart
 * 5. Build Netopia encrypted payment request
 * 6. Return payment form data to the frontend
 */
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
    res.status(400).json({ error: "Cosul este gol" });
    return;
  }

  const total = cartItems.reduce(
    (sum, r) => sum + parseFloat(r.cartItem.price) * r.cartItem.quantity,
    0,
  );

  const netopiaOrderId = `ANK-${Date.now()}`;
  try {
    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(ordersTable)
        .values({
          ...orderData,
          sessionId,
          total: String(Math.round(total * 100) / 100),
          netopiaOrderId,
          paymentMethod: "card",
        })
        .returning();

      await tx.insert(orderItemsTable).values(
        cartItems.map((r) => ({
          orderId: order.id,
          productId: r.cartItem.productId,
          productTitle: r.product?.title ?? "Unknown",
          productImage: r.product?.images?.[0] ?? null,
          price: r.cartItem.price,
          quantity: r.cartItem.quantity,
          size: r.cartItem.size,
        })),
      );

      // Reserve inventory as part of the same transaction as the order. The
      // stock predicate makes this safe when two customers buy the last units
      // concurrently: only one update can succeed and the other order rolls
      // back without clearing its cart.
      for (const row of cartItems) {
        if (!row.product) {
          throw new Error("Un produs din cos nu mai este disponibil.");
        }

        const [updatedProduct] = await tx
          .update(productsTable)
          .set({ stock: sql`${productsTable.stock} - ${row.cartItem.quantity}` })
          .where(
            and(
              eq(productsTable.id, row.cartItem.productId),
              gte(productsTable.stock, row.cartItem.quantity),
            ),
          )
          .returning({ id: productsTable.id });

        if (!updatedProduct) {
          throw new Error(`Stoc insuficient pentru ${row.product.title}.`);
        }
      }

      await tx.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));

      const netopiaConfig = getNetopiaConfig();
      const paymentRequest = encryptPaymentRequest(netopiaConfig, {
        orderId: netopiaOrderId,
        amount: total.toFixed(2),
        currency: "RON",
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        billingAddress: orderData.shippingAddress,
        billingCity: orderData.city,
        billingCountry: "RO",
        description: `Comanda #${order.id} - Anks Boutique (${cartItems.length} produse)`,
      });

      return {
        order,
        paymentRequest,
        netopiaConfig,
      };
    });

    logger.info(
      {
        orderId: result.order.id,
        netopiaOrderId,
        paymentUrl: result.paymentRequest.paymentUrl,
      },
      "Netopia payment request prepared",
    );

    res.status(201).json({
      orderId: result.order.id,
      paymentUrl: result.paymentRequest.paymentUrl,
      netopiaFormData: {
        env_key: result.paymentRequest.envKey,
        data: result.paymentRequest.data,
        cipher: result.paymentRequest.cipher,
        iv: result.paymentRequest.iv,
      },
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        sessionId,
        netopiaOrderId,
        cartItemCount: cartItems.length,
        total,
      },
      "Failed to create Netopia payment request",
    );
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Plata Netopia nu a putut fi pregatita.",
    });
  }
});

/**
 * GET /orders/:id — Get a single order by ID.
 */
router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Comanda nu a fost gasita" });
    return;
  }

  res.json(await buildOrderResponse(order));
});

/**
 * PATCH /orders/:id/status — Update order status (admin only).
 */
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
    res.status(404).json({ error: "Comanda nu a fost gasita" });
    return;
  }

  res.json(await buildOrderResponse(order));
});

// ── Netopia Payment Routes ───────────────────────────────────────────────────

/**
 * POST /payments/netopia/callback — Netopia IPN (Instant Payment Notification).
 *
 * Netopia sends a POST request with form-encoded `env_key` and `data` fields
 * after each payment attempt. We decrypt and verify the payload, then update
 * the order status accordingly.
 *
 * We must respond with a valid XML `<crc>` element:
 * - Success: empty `<crc></crc>`
 * - Error: `<crc error_type="X" error_code="Y">Message</crc>`
 */
router.post("/payments/netopia/callback", async (req: Request, res: Response): Promise<void> => {
  const { env_key, data, cipher, iv } = req.body ?? {};
  const requestId = (req as Request & { id?: string }).id;

  if (typeof env_key !== "string" || !env_key || typeof data !== "string" || !data) {
    logger.warn(
      {
        requestId,
        bodyKeys: Object.keys(req.body ?? {}),
      },
      "Netopia IPN callback missing env_key or data",
    );
    res.set("Content-Type", "text/xml");
    res.status(200).send(
      buildIpnConfirmationXml({ type: "2", code: "1", message: "Missing env_key or data" }),
    );
    return;
  }

  try {
    const netopiaConfig = getNetopiaConfig();
    const ipnResult = decryptIpnResponse(
      netopiaConfig,
      env_key,
      data,
      typeof cipher === "string" ? cipher : undefined,
      typeof iv === "string" ? iv : undefined,
    );

    // An error without an order ID means the callback itself could not be
    // decrypted/parsed. A rejected payment, however, is a valid callback and
    // includes the order ID; it must update the order and notify the customer.
    if (ipnResult.status === "error" && !ipnResult.orderId) {
      logger.warn(
        {
          requestId,
          errorMessage: ipnResult.errorMessage,
          errorStage: ipnResult.errorStage,
          envKeyLength: env_key.length,
          dataLength: data.length,
        },
        "Netopia IPN decryption failed",
      );
      res.set("Content-Type", "text/xml");
      res.status(200).send(
        buildIpnConfirmationXml({
          type: "1",
          code: "1",
          message: ipnResult.errorMessage ?? "Netopia IPN decryption failed",
        }),
      );
      return;
    }

    if (ipnResult.orderId) {
      const [order] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.netopiaOrderId, ipnResult.orderId));

      if (!order) {
        res.set("Content-Type", "text/xml");
        res.send(buildIpnConfirmationXml({ type: "2", code: "2", message: "Unknown order" }));
        return;
      }

      const callbackAmount = Number(ipnResult.amount);
      const amountMatches = ipnResult.amount !== undefined && Number.isFinite(callbackAmount) && callbackAmount === Number(order.total);
      const currencyMatches = ipnResult.currency?.toUpperCase() === "RON";
      if (!amountMatches || !currencyMatches) {
        logger.warn({ requestId, orderId: order.id }, "Rejected NETOPIA callback with mismatched payment details");
        res.set("Content-Type", "text/xml");
        res.send(buildIpnConfirmationXml({ type: "2", code: "3", message: "Payment details mismatch" }));
        return;
      }

      {
        let updateData: Partial<typeof ordersTable.$inferInsert> = {};

        switch (ipnResult.status) {
          case "paid":
            updateData = {
              paymentStatus: "paid",
              status: "confirmed",
            };
            break;
          case "cancelled":
            updateData = {
              paymentStatus: "cancelled",
              status: "cancelled",
            };
            break;
          case "error":
            updateData = {
              paymentStatus: "failed",
              status: "cancelled",
            };
            break;
          case "pending":
          default:
            updateData = {
              paymentStatus: "pending",
            };
            break;
        }

        const transitionedOrder = await db.transaction(async (tx) => {
          const [updated] = await tx
            .update(ordersTable)
            .set(updateData)
            .where(and(eq(ordersTable.id, order.id), eq(ordersTable.paymentStatus, "pending")))
            .returning();

          // Inventory was reserved when checkout started. Release it once when
          // the payment reaches an unsuccessful terminal state.
          if (updated && (ipnResult.status === "cancelled" || ipnResult.status === "error")) {
            const items = await tx.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
            for (const item of items) {
              await tx
                .update(productsTable)
                .set({ stock: sql`${productsTable.stock} + ${item.quantity}` })
                .where(eq(productsTable.id, item.productId));
            }
          }
          return updated;
        });

        const effectivePaymentStatus = transitionedOrder?.paymentStatus ?? order.paymentStatus;
        if (ipnResult.status === "paid" && effectivePaymentStatus === "paid") {
          await sendPaidNotifications(order.id);
        } else if (ipnResult.status === "cancelled" && effectivePaymentStatus === "cancelled") {
          await sendUnsuccessfulPaymentEmail(order.id, "cancelled");
        } else if (ipnResult.status === "error" && effectivePaymentStatus === "failed") {
          await sendUnsuccessfulPaymentEmail(order.id, "failed");
        }
      }
    }

    res.set("Content-Type", "text/xml");
    res.send(buildIpnConfirmationXml());
  } catch (error) {
    logger.error(
      {
        err: error,
        requestId,
        envKeyLength: env_key.length,
        dataLength: data.length,
      },
      "Error processing Netopia IPN callback",
    );
    res.set("Content-Type", "text/xml");
    res.send(
      buildIpnConfirmationXml({ type: "1", code: "1", message: "Internal server error" }),
    );
  }
});

/**
 * GET /payments/netopia/return — Return URL after customer completes payment on Netopia.
 *
 * Netopia redirects the user to this URL after a payment attempt.
 * We display the receipt page showing the payment result.
 */
router.get("/payments/netopia/return", async (req: Request, res: Response): Promise<void> => {
  const orderIdParam = req.query["orderId"] as string | undefined;
  const netopiaOrderId = req.query["orderId"] as string | undefined;

  try {
    // Try to find the order by either our order ID or Netopia order ID
    let order;

    if (orderIdParam && /^\d+$/.test(orderIdParam)) {
      [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, parseInt(orderIdParam, 10)));
    }

    if (!order && netopiaOrderId) {
      [order] = await db.select().from(ordersTable).where(eq(ordersTable.netopiaOrderId, netopiaOrderId));
    }

    if (!order) {
      res.status(404).send("Comanda nu a fost g&#259;sit&#259;");
      return;
    }

    const html = await getReceiptHtml(order.id);
    if (!html) {
      res.status(404).send("Comanda nu a fost g&#259;sit&#259;");
      return;
    }

    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    logger.error({ err: error, orderId: orderIdParam }, "Error rendering Netopia receipt");
    res.status(500).send("Eroare intern&#259;");
  }
});

export default router;
