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
  getNetopiaStartupDiagnostics,
} from "../lib/netopia";
import { logger } from "../lib/logger";
import { spawn } from "node:child_process";
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
  } else {
    statusClass = "error";
    statusIcon = "&#10007;";
    statusTitle = "Plata nu a fost procesat&#259;";
    statusMessage = "Plata nu a putut fi procesat&#259;. Te rug&#259;m s&#259; &#238;ncerei din nou sau s&#259; folose&#351;ti o alt&#259; metod&#259; de plat&#259;.";
  }

  const paymentStatusLabel = isPaid ? "Pl&#259;tit" : isPending ? "&#206;n a&#351;teptare" : "Nepl&#259;tit";

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
      console.log("========== NETOPIA NEW ROUTE ==========");
      console.log("encryptPaymentRequest is being called");
      console.log({
        merchantId: netopiaConfig.merchantId,
        sandbox: netopiaConfig.sandbox,
        hasPublicKey: !!netopiaConfig.publicKey,
      });
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

      console.log(paymentRequest);

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
        netopia: getNetopiaStartupDiagnostics(result.netopiaConfig),
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
  const { env_key, data, cipher, iv } = req.body;
  const requestId = (req as Request & { id?: string }).id;

  logger.info(
    {
      requestId,
      hasEnvKey: !!env_key,
      envKeyLength: env_key ? env_key.length : 0,
      hasData: !!data,
      dataLength: data ? data.length : 0,
      contentType: req.headers["content-type"],
      bodyKeys: Object.keys(req.body),
    },
    "Netopia IPN callback received",
  );

  if (!env_key || !data) {
    logger.warn(
      {
        requestId,
        bodyKeys: Object.keys(req.body),
      },
      "Netopia IPN callback missing env_key or data",
    );
    res.set("Content-Type", "text/xml");
    res.status(400).send(
      buildIpnConfirmationXml({ type: "1", code: "1", message: "Missing env_key or data" }),
    );
    return;
  }

  try {
    const netopiaConfig = getNetopiaConfig();
    logger.info(
      {
        requestId,
        netopia: getNetopiaStartupDiagnostics(netopiaConfig),
      },
      "Starting Netopia IPN decryption",
    );
    const ipnResult = decryptIpnResponse(netopiaConfig, env_key, data, cipher, iv);
    logger.info(
      {
        requestId,
        status: ipnResult.status,
        orderId: ipnResult.orderId,
        transactionId: ipnResult.transactionId,
        amount: ipnResult.amount,
        currency: ipnResult.currency,
        errorMessage: ipnResult.errorMessage,
        errorStage: ipnResult.errorStage,
      },
      "Netopia IPN decryption completed",
    );

    if (ipnResult.status === "error") {
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

      if (order) {
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
          case "pending":
          default:
            updateData = {
              paymentStatus: "pending",
            };
            break;
        }

        await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, order.id));
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
    console.error("[Netopia Return] Error rendering receipt:", error);
    res.status(500).send("Eroare intern&#259;");
  }
});

router.get("/debug/netopia-config", (_req: Request, res: Response): void => {
  try {
    const netopiaConfig = loadConfigFromEnv();
    const diagnostics = getNetopiaStartupDiagnostics(netopiaConfig);

    res.json({
      sandbox: diagnostics.sandbox,
      sandboxRaw: process.env["NETOPIA_SANDBOX"] ?? null,
      nodeEnv: process.env["NODE_ENV"] ?? null,
      merchantIdPresent: Boolean(netopiaConfig.merchantId),
      merchantIdLength: netopiaConfig.merchantId.length,
      paymentUrl: diagnostics.paymentUrl,
      publicKeyLoaded: Boolean(netopiaConfig.publicKey),
      privateKeyLoaded: Boolean(netopiaConfig.privateKey),
      publicKeyValid: diagnostics.publicKeyValid,
      privateKeyValid: diagnostics.privateKeyValid,
      keyPairMatches: diagnostics.keyPairMatches,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to load Netopia debug config");
    res.status(500).json({
      error: "Failed to load Netopia config",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post("/debug/restart-api", async (_req: Request, res: Response): Promise<void> => {
  if (process.env["DEBUG_ALLOW_SCRIPT_RUN"] !== "true") {
    res.status(403).json({ error: "Script execution is disabled." });
    return;
  }

  const repoRoot = path.resolve(__dirname, "../../../..");
  const command = "pnpm";
  const args = ["--dir", repoRoot, "--filter", "@workspace/scripts", "run", "restart-api"];

  try {
    const child = spawn(command, args, {
      cwd: repoRoot,
      shell: true,
      detached: true,
      stdio: "ignore",
    });

    child.unref();

    res.status(202).json({
      status: "restart-scheduled",
      message: "Restart script has been triggered.",
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        repoRoot,
        command,
        args,
      },
      "Failed to start API restart script",
    );
    res.status(500).json({ error: String(error) });
  }
});

export default router;
