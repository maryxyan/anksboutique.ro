/**
 * Netopia (MobilPay) Payment Processor Integration
 *
 * This module handles:
 *  - Encryption of payment requests (AES-256 + RSA)
 *  - Decryption of IPN (Instant Payment Notification) callbacks
 *  - XML envelope generation and parsing
 *  - Sandbox / live environment switching
 *
 * Netopia payment flow:
 *  1. Merchant builds an XML request, encrypts it, sends env_key + data to client
 *  2. Client browser POSTs env_key + data to Netopia's payment page
 *  3. User pays on Netopia's secure page
 *  4. Netopia sends IPN callback to our server (POST /payments/netopia/callback)
 *  5. Netopia redirects user back to our return URL (GET /payments/netopia/return)
 *
 * ⚠️  IMPORTANT: This module uses Node.js built-in `crypto` for RSA/AES encryption.
 *    No external XML parsing library is needed -- Netopia's XML format is simple
 *    and well-defined, so we build and parse XML manually with string operations.
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

// ── Types ────────────────────────────────────────────────────────────────────

export interface NetopiaConfig {
  /** Merchant account identifier provided by Netopia */
  merchantId: string;
  /** RSA public key (PEM string or path to PEM file) */
  publicKey: string;
  /** RSA private key (PEM string or path to PEM file) */
  privateKey: string;
  /** Use sandbox (test) environment */
  sandbox: boolean;
  /** API key/token for Netopia's newer JSON APIs; not used by the legacy XML checkout flow */
  apiKey?: string;
  /** Custom payment URL override (optional) */
  paymentUrl?: string;
  /** Custom API URL override (optional) */
  apiUrl?: string;
}

export interface PaymentOrderData {
  /** Unique order ID in merchant's system */
  orderId: string;
  /** Order total amount (e.g. "199.99") */
  amount: string;
  /** Currency code (e.g. "RON", "EUR") */
  currency: string;
  /** Customer's full name */
  customerName: string;
  /** Customer's email address */
  customerEmail: string;
  /** Customer's phone number */
  customerPhone?: string;
  /** Customer's billing address */
  billingAddress?: string;
  /** Customer's city */
  billingCity?: string;
  /** Customer's country code (e.g. "RO") */
  billingCountry?: string;
  /** Order description (shown on payment page) */
  description?: string;
  /** URL to return after successful payment */
  returnUrl?: string;
  /** URL for IPN callbacks (confirmation URL) */
  confirmUrl?: string;
}

export interface PaymentRequestResult {
  /** Base64-encoded encrypted AES key (env_key) */
  envKey: string;
  /** Base64-encoded encrypted payment data */
  data: string;
  /** The URL where the form should be submitted to */
  paymentUrl: string;
}

export interface IpnResponse {
  /** Payment status: "pending" | "paid" | "cancelled" | "error" */
  status: "pending" | "paid" | "cancelled" | "error";
  /** Netopia's transaction ID */
  transactionId?: string;
  /** Original merchant order ID */
  orderId?: string;
  /** Amount that was paid */
  amount?: string;
  /** Currency */
  currency?: string;
  /** Error message if status is "error" */
  errorMessage?: string;
  /** Raw decrypted payload for debugging */
  rawPayload?: Record<string, unknown>;
}

// ── Default URLs ─────────────────────────────────────────────────────────────

const SANDBOX_PAYMENT_URL = "https://sandboxsecure.mobilpay.ro/card/";
const LIVE_PAYMENT_URL = "https://secure.mobilpay.ro/card/";

// ── Configuration ────────────────────────────────────────────────────────────

function resolveKey(keyRaw: string): string {
  if (!keyRaw) return "";
  let cleanPath = keyRaw;
  if (cleanPath.startsWith("file://")) {
    cleanPath = cleanPath.slice(7);
  }
  if (fs.existsSync(cleanPath)) {
    return fs.readFileSync(cleanPath, "utf-8").trim();
  }
  if (!cleanPath.includes("-----BEGIN")) {
    const resolved = path.resolve(process.cwd(), cleanPath);
    if (fs.existsSync(resolved)) {
      return fs.readFileSync(resolved, "utf-8").trim();
    }
  }
  return keyRaw.trim();
}

/**
 * Load Netopia configuration from environment variables.
 * Scans both raw key strings and file paths (prefixed with "file://" or local paths).
 */
export function loadConfigFromEnv(): NetopiaConfig {
  const sandbox = process.env["NETOPIA_SANDBOX"] !== "false";
  const merchantId = process.env["NETOPIA_MERCHANT_ID"] ?? "";
  const publicKeyRaw = process.env["NETOPIA_PUBLIC_KEY_PATH"] ?? "";
  const privateKeyRaw = process.env["NETOPIA_PRIVATE_KEY_PATH"] ?? "";

  const publicKey = resolveKey(publicKeyRaw);
  const privateKey = resolveKey(privateKeyRaw);

  return {
    merchantId,
    publicKey,
    privateKey,
    sandbox,
    apiKey: process.env["NETOPIA_API_KEY"] || undefined,
    paymentUrl: process.env["NETOPIA_PAYMENT_URL"] || undefined,
    apiUrl: process.env["NETOPIA_API_URL"] || undefined,
  };
}

/**
 * Create a default Netopia config for testing/development when
 * proper credentials are not yet configured.
 */
export function createSandboxStubConfig(): NetopiaConfig {
  return {
    merchantId: "TEST_MERCHANT",
    publicKey: "",
    privateKey: "",
    sandbox: true,
    apiKey: undefined,
  };
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0] || "Client", lastName: parts[0] || "Client" };
  }
  const lastName = parts.pop() || "Client";
  const firstName = parts.join(" ") || "Client";
  return { firstName, lastName };
}

// ── XML Envelope Building (Manual string-based) ─────────────────────────────

/**
 * Build the Netopia payment XML request envelope.
 */
function buildPaymentXml(config: NetopiaConfig, order: PaymentOrderData): string {
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  const baseUrl = process.env["APP_BASE_URL"] ?? "https://anksboutique.ro";
  const returnUrl = escapeXml(
    order.returnUrl ?? `${baseUrl}/api/payments/netopia/return?orderId=${order.orderId}`,
  );
  const confirmUrl = escapeXml(
    order.confirmUrl ?? `${baseUrl}/api/payments/netopia/callback`,
  );

  const { firstName, lastName } = splitName(order.customerName);

  if (!config.merchantId) {
    throw new Error("NETOPIA_MERCHANT_ID is required to build the payment request.");
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<order type="card" id="${escapeXml(order.orderId)}" timestamp="${escapeXml(timestamp)}">`,
    `  <signature>${escapeXml(config.merchantId)}</signature>`,
    "  <url>",
    `    <return>${returnUrl}</return>`,
    `    <confirm>${confirmUrl}</confirm>`,
    "  </url>",
    `  <ipn_cipher>aes-256-cbc</ipn_cipher>`,
    `  <invoice currency="${escapeXml(order.currency)}" amount="${escapeXml(order.amount)}">`,
    `    <details>${escapeXml(order.description ?? `Comanda #${order.orderId} - Anks Boutique`)}</details>`,
    "    <contact_info>",
    '      <billing type="person">',
    `        <first_name>${escapeXml(firstName)}</first_name>`,
    `        <last_name>${escapeXml(lastName)}</last_name>`,
    `        <email>${escapeXml(order.customerEmail)}</email>`,
    `        <mobile_phone>${escapeXml(order.customerPhone ?? "")}</mobile_phone>`,
    `        <address>${escapeXml(order.billingAddress ?? "")}</address>`,
    `        <city>${escapeXml(order.billingCity ?? "")}</city>`,
    `        <country>${escapeXml(order.billingCountry ?? "RO")}</country>`,
    "      </billing>",
    '      <shipping type="person">',
    `        <first_name>${escapeXml(firstName)}</first_name>`,
    `        <last_name>${escapeXml(lastName)}</last_name>`,
    `        <email>${escapeXml(order.customerEmail)}</email>`,
    `        <mobile_phone>${escapeXml(order.customerPhone ?? "")}</mobile_phone>`,
    `        <address>${escapeXml(order.billingAddress ?? "")}</address>`,
    `        <city>${escapeXml(order.billingCity ?? "")}</city>`,
    `        <country>${escapeXml(order.billingCountry ?? "RO")}</country>`,
    "      </shipping>",
    "    </contact_info>",
    "  </invoice>",
    "</order>",
  ].join("\n");

  return xml;
}

/**
 * Parse a simple XML string into a key-value object structure.
 * This is a lightweight parser for Netopia's well-known XML format.
 * Returns a nested object representation.
 */
function parseSimpleXml(xml: string): Record<string, unknown> | null {
  try {
    const result: Record<string, unknown> = {};

    // Extract the root element name and content
    const rootMatch = xml.match(/<(\w+)[^>]*>([\s\S]*)<\/\1>/);
    if (!rootMatch) return null;

    const rootName = rootMatch[1];
    const rootContent = rootMatch[2];

    // Parse child elements
    const children = parseChildren(rootContent);
    result[rootName] = children;

    return result;
  } catch {
    return null;
  }
}

/**
 * Parse a block of XML child elements into an object or array.
 */
function parseChildren(xml: string): Record<string, unknown> | string {
  const result: Record<string, unknown> = {};
  const elementRegex = /<(\w+)([^>]*)>([\s\S]*?)<\/\1>/g;
  let match;
  let hasElements = false;

  while ((match = elementRegex.exec(xml)) !== null) {
    hasElements = true;
    const [, tagName, attributesStr, content] = match;

    // Parse attributes
    const attrs: Record<string, string> = {};
    const attrRegex = /(\w+)=["']([^"']*)["']/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }

    // Check if content has nested elements
    const trimmedContent = content.trim();
    const nestedChildren = parseChildren(trimmedContent);

    let value: unknown;
    if (typeof nestedChildren === "object" && Object.keys(nestedChildren).length > 0) {
      value = nestedChildren;
    } else {
      value = trimmedContent;
    }

    // If there are attributes, wrap in an object with @_ prefix convention
    if (Object.keys(attrs).length > 0 && typeof value === "object") {
      (value as Record<string, unknown>)["@_id"] = attrs["id"] ?? "";
    } else if (Object.keys(attrs).length > 0) {
      value = {
        "#text": value,
        "@_id": attrs["id"] ?? "",
      };
    }

    // Handle duplicate tags (like multiple items)
    if (result[tagName] !== undefined) {
      if (!Array.isArray(result[tagName])) {
        result[tagName] = [result[tagName]];
      }
      (result[tagName] as unknown[]).push(value);
    } else {
      result[tagName] = value;
    }
  }

  return hasElements ? result : xml.trim();
}

// ── Encryption / Decryption ──────────────────────────────────────────────────

/**
 * Encrypt payment data for Netopia.
 *
 * Netopia uses a hybrid encryption scheme:
 * 1. Generate a random AES-256 key
 * 2. Encrypt the XML payload with AES-256-CBC
 * 3. Encrypt the AES key with Netopia's RSA-2048 public key
 * 4. Return env_key (RSA-encrypted AES key, base64) and data (AES-encrypted payload, base64)
 */
export function encryptPaymentRequest(
  config: NetopiaConfig,
  order: PaymentOrderData,
): PaymentRequestResult {
  if (!config.publicKey) {
    // Fallback for development: return unencrypted data (sandbox-only)
    return {
      envKey: Buffer.from(JSON.stringify({ cipher: "none", merchant: config.merchantId })).toString(
        "base64",
      ),
      data: Buffer.from(JSON.stringify(order)).toString("base64"),
      paymentUrl: getPaymentUrl(config),
    };
  }

  // Build XML envelope
  const xmlPayload = buildPaymentXml(config, order);

  // Generate random 32-byte AES key
  const aesKey = crypto.randomBytes(32);

  // Generate random 16-byte IV
  const iv = crypto.randomBytes(16);

  // Encrypt XML payload with AES-256-CBC
  const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
  const encryptedPayload = Buffer.concat([cipher.update(xmlPayload, "utf-8"), cipher.final()]);

  // Combine raw IV (16 bytes) + raw ciphertext, then base64 encode
  const combined = Buffer.concat([iv, encryptedPayload]);
  const data = combined.toString("base64");

  // Encrypt AES key with RSA public key
  const encryptedAesKey = crypto.publicEncrypt(
    {
      key: config.publicKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    aesKey,
  );
  const envKey = encryptedAesKey.toString("base64");

  return {
    envKey,
    data,
    paymentUrl: getPaymentUrl(config),
  };
}

/**
 * Decrypt an IPN callback from Netopia.
 *
 * Steps:
 * 1. Decrypt env_key (base64) using RSA private key to get AES key
 * 2. Decrypt data (base64) using AES key to get XML payload
 * 3. Parse XML payload
 */
export function decryptIpnResponse(
  config: NetopiaConfig,
  envKeyBase64: string,
  dataBase64: string,
): IpnResponse {
  try {
    if (!config.privateKey) {
      // Dev fallback: try to parse as JSON directly
      try {
        const payload = JSON.parse(Buffer.from(dataBase64, "base64").toString());
        return {
          status: "paid",
          orderId: payload.order_id || payload.orderId,
          amount: payload.amount,
          currency: payload.currency || "RON",
        };
      } catch {
        // Try parsing as XML
        const xml = Buffer.from(dataBase64, "base64").toString();
        return parseIpnFromXml(config, xml);
      }
    }

    // Decrypt env_key with RSA private key to get AES key
    const encryptedAesKey = Buffer.from(envKeyBase64, "base64");
    const aesKey = crypto.privateDecrypt(
      {
        key: config.privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      encryptedAesKey,
    );

    // Decrypt data: first 16 bytes are IV, rest is ciphertext
    const encryptedPayload = Buffer.from(dataBase64, "base64");
    const iv = encryptedPayload.subarray(0, 16);
    const ciphertext = encryptedPayload.subarray(16);

    const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, iv);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const xml = decrypted.toString("utf-8");
    return parseIpnFromXml(config, xml);
  } catch (error) {
    return {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Decryption failed",
    };
  }
}

// ── XML IPN Parsing ──────────────────────────────────────────────────────────

/**
 * Parse a Netopia IPN XML response into a structured result.
 *
 * Netopia IPN XML format:
 * ```xml
 * <?xml version="1.0" encoding="UTF-8"?>
 * <crc>
 *   <order id="ORDER_ID">
 *     <signature>MERCHANT_ID</signature>
 *     <status>paid|canceled|confirmed|pending</status>
 *     <transaction id="TRANSACTION_ID">...</transaction>
 *     <invoice>
 *       <amount>...</amount>
 *       <currency>...</currency>
 *     </invoice>
 *   </order>
 * </crc>
 * ```
 */
function parseIpnFromXml(config: NetopiaConfig, xml: string): IpnResponse {
  const parsed = parseSimpleXml(xml);
  if (!parsed) {
    return { status: "error", errorMessage: "Failed to parse IPN XML" };
  }

  // Navigate the parsed XML object to extract payment info
  const crc = parsed["crc"] as Record<string, unknown> | undefined;
  const order = crc?.["order"] as Record<string, unknown> | undefined;

  if (!order) {
    return { status: "error", errorMessage: "Invalid IPN XML structure" };
  }

  const rawStatus = String(order["status"] ?? "").toLowerCase();
  const transaction = order["transaction"] as Record<string, unknown> | undefined;
  const invoice = order["invoice"] as Record<string, unknown> | undefined;

  let status: IpnResponse["status"] = "pending";
  if (rawStatus === "paid" || rawStatus === "confirmed") {
    status = "paid";
  } else if (rawStatus === "canceled" || rawStatus === "cancelled") {
    status = "cancelled";
  } else if (rawStatus === "error" || rawStatus === "rejected") {
    status = "error";
  }

  // Extract transaction ID and order ID, handling attribute-wrapped values
  let transactionId: string | undefined;
  if (transaction) {
    if (typeof transaction === "object") {
      transactionId =
        (transaction as Record<string, unknown>)["@_id"] as string | undefined ??
        String((transaction as Record<string, unknown>)["#text"] ?? "");
    } else {
      transactionId = String(transaction);
    }
  }

  let orderId: string | undefined;
  if (typeof order === "object" && order !== null) {
    orderId =
      (order as Record<string, unknown>)["@_id"] as string | undefined ?? String(order["id"] ?? "");
  }

  const amount =
    invoice && typeof invoice === "object"
      ? (invoice as Record<string, unknown>)["amount"] as string | undefined
      : undefined;
  const currency =
    invoice && typeof invoice === "object"
      ? (invoice as Record<string, unknown>)["currency"] as string | undefined
      : undefined;

  return {
    status,
    transactionId,
    orderId,
    amount,
    currency,
    rawPayload: parsed,
  };
}

// ── Response XML Generation ──────────────────────────────────────────────────

/**
 * Generate the XML confirmation response for Netopia's IPN callback.
 *
 * Netopia expects an XML response with an `<crc>` element:
 * - Success: `<crc></crc>` (empty)
 * - Error:   `<crc error_type="..." error_code="...">Error message</crc>`
 */
export function buildIpnConfirmationXml(error?: {
  type: string;
  code: string;
  message: string;
}): string {
  if (error) {
    return `<?xml version="1.0" encoding="utf-8"?>
<crc error_type="${escapeXml(error.type)}" error_code="${escapeXml(error.code)}">${escapeXml(error.message)}</crc>`;
  }
  return `<?xml version="1.0" encoding="utf-8"?>
<crc></crc>`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get the appropriate Netopia payment URL based on config.
 */
function getPaymentUrl(config: NetopiaConfig): string {
  if (config.paymentUrl) return config.paymentUrl;
  return config.sandbox ? SANDBOX_PAYMENT_URL : LIVE_PAYMENT_URL;
}

/**
 * Escape special XML characters.
 */
function escapeXml(str: string): string {
  const amp = String.fromCharCode(38) + "amp;";
  const lt = String.fromCharCode(38) + "lt;";
  const gt = String.fromCharCode(38) + "gt;";
  const quot = String.fromCharCode(38) + "quot;";
  const apos = String.fromCharCode(38) + "apos;";
  return str
    .replace(/&/g, amp)
    .replace(/</g, lt)
    .replace(/>/g, gt)
    .replace(/"/g, quot)
    .replace(/'/g, apos);
}

/**
 * Check if the Netopia configuration has valid RSA keys loaded.
 */
export function hasValidKeys(config: NetopiaConfig): boolean {
  return Boolean(config.publicKey && config.privateKey);
}

/**
 * Determine whether to use stub (dev) mode or real encryption.
 */
export function isConfigured(config: NetopiaConfig): boolean {
  return Boolean(config.merchantId && config.merchantId !== "TEST_MERCHANT");
}

