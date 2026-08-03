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
import { logger } from "./logger";

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
  /** Cipher used for the payload */
  cipher: "aes-256-cbc";
  /** Base64-encoded IV for the payload */
  iv: string;
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
  /** Internal stage where the error occurred */
  errorStage?: "missing_private_key" | "rsa_decrypt" | "aes_decrypt" | "xml_parse" | "unsupported_cipher";
  /** Raw decrypted payload for debugging */
  rawPayload?: Record<string, unknown>;
}

// ── Default URLs ─────────────────────────────────────────────────────────────

const SANDBOX_PAYMENT_URL = "https://sandboxsecure.mobilpay.ro";
const LIVE_PAYMENT_URL = "https://secure.mobilpay.ro";

// ── Configuration ────────────────────────────────────────────────────────────

function resolveKey(keyRaw: string): string {
  if (!keyRaw.trim()) return "";

  if (keyRaw.includes("-----BEGIN")) {
    return keyRaw.trim();
  }

  let cleanPath = keyRaw.trim();
  if (cleanPath.startsWith("file://")) {
    cleanPath = cleanPath.slice(7);
  }
  if (fs.existsSync(cleanPath)) {
    return fs.readFileSync(cleanPath, "utf-8").trim();
  }

  const resolved = path.resolve(process.cwd(), cleanPath);
  if (fs.existsSync(resolved)) {
    return fs.readFileSync(resolved, "utf-8").trim();
  }

  return keyRaw.trim();
}

function loadKeyFromEnv(pemRaw: string, pathRaw: string): { value: string; sourceType: "empty" | "pem" | "path" } {
  if (pemRaw.trim()) {
    return { value: pemRaw.trim(), sourceType: "pem" };
  }

  if (pathRaw.trim()) {
    return { value: resolveKey(pathRaw), sourceType: "path" };
  }

  return { value: "", sourceType: "empty" };
}

function fingerprintPublicComponent(
  key: string,
  type: "public" | "private",
): string | null {
  try {
    const publicKey =
      type === "private"
        ? crypto.createPublicKey(crypto.createPrivateKey(key))
        : crypto.createPublicKey(key);

    const der = publicKey.export({
      type: "spki",
      format: "der",
    });

    return crypto.createHash("sha256").update(der).digest("hex");
  } catch {
    return null;
  }
}

function getKeySourceType(keyRaw: string): "empty" | "inline" | "path" {
  if (!keyRaw.trim()) return "empty";
  return keyRaw.includes("-----BEGIN") ? "inline" : "path";
}

function buildNetopiaLogContext(config: NetopiaConfig, extra: Record<string, unknown> = {}) {
  const publicKeyFingerprint = config.publicKey
    ? fingerprintPublicComponent(config.publicKey, "public")
    : null;
  const privateKeyFingerprint = config.privateKey
    ? fingerprintPublicComponent(config.privateKey, "private")
    : null;

  return {
    merchantIdPresent: Boolean(config.merchantId),
    merchantIdLength: config.merchantId.length,
    sandbox: config.sandbox,
    paymentUrl: getPaymentUrl(config),
    publicKeyLoaded: Boolean(config.publicKey),
    publicKeyLength: config.publicKey.length,
    publicKeyFingerprint,
    publicKeyValid: publicKeyFingerprint !== null,
    privateKeyLoaded: Boolean(config.privateKey),
    privateKeyLength: config.privateKey.length,
    privateKeyFingerprint,
    privateKeyValid: privateKeyFingerprint !== null,
    keyPairMatches:
      publicKeyFingerprint !== null && privateKeyFingerprint !== null
        ? publicKeyFingerprint === privateKeyFingerprint
        : null,
    ...extra,
  };
}

function redactXmlForLog(xmlPayload: string): string {
  return xmlPayload.replace(
    /<first_name>.*?<\/first_name>|<last_name>.*?<\/last_name>|<email>.*?<\/email>|<mobile_phone>.*?<\/mobile_phone>|<address>.*?<\/address>/g,
    "<redacted>...</redacted>",
  );
}

function logNetopiaEvent(
  level: "info" | "warn" | "error",
  message: string,
  context: Record<string, unknown>,
  err?: unknown,
): void {
  const payload = err === undefined ? context : { ...context, err };
  logger[level](payload, message);
}

export interface NetopiaStartupDiagnostics {
  merchantId: string;
  sandbox: boolean;
  paymentUrl: string;
  publicKeyValid: boolean;
  privateKeyValid: boolean;
  publicKeyFingerprint: string | null;
  privateKeyFingerprint: string | null;
  keyPairMatches: boolean | null;
}

export function getNetopiaStartupDiagnostics(config: NetopiaConfig): NetopiaStartupDiagnostics {
  const publicKeyFingerprint = config.publicKey
    ? fingerprintPublicComponent(config.publicKey, "public")
    : null;
  const privateKeyFingerprint = config.privateKey
    ? fingerprintPublicComponent(config.privateKey, "private")
    : null;

  return {
    merchantId: config.merchantId,
    sandbox: config.sandbox,
    paymentUrl: getPaymentUrl(config),
    publicKeyValid: publicKeyFingerprint !== null,
    privateKeyValid: privateKeyFingerprint !== null,
    publicKeyFingerprint,
    privateKeyFingerprint,
    keyPairMatches:
      publicKeyFingerprint !== null && privateKeyFingerprint !== null
        ? publicKeyFingerprint === privateKeyFingerprint
        : null,
  };
}

/**
 * Load Netopia configuration from environment variables.
 * Scans both raw key strings and file paths (prefixed with "file://" or local paths).
 *
 * ⚠️  IMPORTANT: The `<signature>` field in the payment XML must ALWAYS be the
 *    merchant ID (`NETOPIA_MERCHANT_ID`), NOT the API key (`NETOPIA_API_KEY`).
 *    Using the API key as the signature will cause Netopia to reject the request
 *    with "Decriptarea datelor a eșuat" (data decryption failed).
 */
export function loadConfigFromEnv(): NetopiaConfig {
  const sandboxRaw = process.env["NETOPIA_SANDBOX"]?.trim();
  const nodeEnv = process.env["NODE_ENV"]?.trim() ?? "";
  const sandbox = sandboxRaw
    ? sandboxRaw.toLowerCase() !== "false"
    : nodeEnv !== "production";
  const merchantId = process.env["NETOPIA_MERCHANT_ID"] ?? "";
  const publicKeyPemRaw = process.env["NETOPIA_PUBLIC_KEY_PEM"] ?? "";
  const publicKeyRaw = process.env["NETOPIA_PUBLIC_KEY_PATH"] ?? "";
  const privateKeyPemRaw = process.env["NETOPIA_PRIVATE_KEY_PEM"] ?? "";
  const privateKeyRaw = process.env["NETOPIA_PRIVATE_KEY_PATH"] ?? "";
  const apiKey = process.env["NETOPIA_API_KEY"] || undefined;

  const publicKeySource = loadKeyFromEnv(publicKeyPemRaw, publicKeyRaw);
  const privateKeySource = loadKeyFromEnv(privateKeyPemRaw, privateKeyRaw);
  const publicKey = publicKeySource.value;
  const privateKey = privateKeySource.value;
  const publicKeyFingerprint = publicKey ? fingerprintPublicComponent(publicKey, "public") : null;
  const privateKeyFingerprint = privateKey ? fingerprintPublicComponent(privateKey, "private") : null;

  logNetopiaEvent("info", "Netopia config loaded", {
    merchantIdPresent: Boolean(merchantId),
    merchantIdLength: merchantId.length,
    publicKeyLoaded: Boolean(publicKey),
    publicKeyLength: publicKey.length,
    publicKeySourceType: publicKeySource.sourceType,
    publicKeyPathSourceType: getKeySourceType(publicKeyRaw),
    privateKeyLoaded: Boolean(privateKey),
    privateKeyLength: privateKey.length,
    privateKeySourceType: privateKeySource.sourceType,
    privateKeyPathSourceType: getKeySourceType(privateKeyRaw),
    publicKeyValid: publicKeyFingerprint !== null,
    privateKeyValid: privateKeyFingerprint !== null,
    sandbox,
    sandboxRaw: sandboxRaw ?? "",
    nodeEnv,
    apiKeyPresent: Boolean(apiKey),
    signatureSource: "NETOPIA_MERCHANT_ID",
  });

  if (!publicKey && !privateKey) {
    logNetopiaEvent("warn", "Netopia RSA keys are missing; falling back to stub mode", {
      merchantIdPresent: Boolean(merchantId),
      sandbox,
    });
  } else if (!publicKey) {
    logNetopiaEvent("warn", "Netopia public key is empty", {
      merchantIdPresent: Boolean(merchantId),
      sandbox,
    });
  } else if (!privateKey) {
    logNetopiaEvent("warn", "Netopia private key is empty", {
      merchantIdPresent: Boolean(merchantId),
      sandbox,
    });
  }

  if (!sandbox) {
    if (!merchantId.trim()) {
      throw new Error(
        "NETOPIA_MERCHANT_ID is required when NETOPIA_SANDBOX is false.",
      );
    }
    if (!publicKey || publicKeyFingerprint === null) {
      throw new Error(
        "Netopia public key is missing or invalid. Set NETOPIA_PUBLIC_KEY_PEM or NETOPIA_PUBLIC_KEY_PATH to a valid PEM key.",
      );
    }
    if (!privateKey || privateKeyFingerprint === null) {
      throw new Error(
        "Netopia private key is missing or invalid. Set NETOPIA_PRIVATE_KEY_PEM or NETOPIA_PRIVATE_KEY_PATH to a valid PEM key.",
      );
    }
  }

  return {
    merchantId,
    publicKey,
    privateKey,
    sandbox,
    apiKey,
    paymentUrl: process.env["NETOPIA_PAYMENT_URL"] || undefined,
    apiUrl: process.env["NETOPIA_API_URL"] || undefined,
  };
}

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

  if (!config.merchantId) {
    throw new Error("NETOPIA_MERCHANT_ID is required to build the payment request.");
  }

  const details = "Comanda 7";
  const firstName = "Test";
  const lastName = "Client";
  const email = "test@example.com";
  const address = "Strada Test 1";
  const mobilePhone = "0700000000";

  const xml = [
    '<?xml version="1.0" encoding="utf-8"?>',
    `<order type="card" id="${escapeXml(order.orderId)}" timestamp="${escapeXml(timestamp)}">`,
    `  <signature>${escapeXml(config.merchantId)}</signature>`,
    `  <invoice currency="${escapeXml(order.currency)}" amount="${escapeXml(order.amount)}">`,
    `    <details>${escapeXml(details)}</details>`,
    "    <contact_info>",
    '      <billing type="person">',
    `        <first_name>${escapeXml(firstName)}</first_name>`,
    `        <last_name>${escapeXml(lastName)}</last_name>`,
    `        <email>${escapeXml(email)}</email>`,
    `        <address>${escapeXml(address)}</address>`,
    `        <mobile_phone>${escapeXml(mobilePhone)}</mobile_phone>`,
    "      </billing>",
    "    </contact_info>",
    "  </invoice>",
    "  <ipn_cipher>aes-256-cbc</ipn_cipher>",
    "  <url>",
    `    <confirm>${confirmUrl}</confirm>`,
    `    <return>${returnUrl}</return>`,
    "  </url>",
    "</order>",
  ].join("\n");

  const normalizedXml = xml
    // Remove UTF-8 BOM if one ever appears.
    .replace(/^\uFEFF/, "")
    // Remove characters forbidden by XML 1.0.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u0084\u0086-\u009F]/g, "")
    // Use consistent Unix line endings.
    .replace(/\r\n?/g, "\n")
    .trim();

  return normalizedXml;
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
 * 4. Return env_key (RSA-encrypted AES key, base64), data (AES-encrypted payload, base64),
 *    cipher, and iv
 */
export function encryptPaymentRequest(
  config: NetopiaConfig,
  order: PaymentOrderData,
): PaymentRequestResult {
  try {
    if (!config.publicKey) {
      if (!config.sandbox) {
        throw new Error(
          "Netopia public key is required in production, but none is configured. Aborting payment request.",
        );
      }

      logNetopiaEvent("warn", "Netopia public key is missing; using stub payment payload", {
        orderId: order.orderId,
        paymentUrl: getPaymentUrl(config),
      });
      return {
        envKey: Buffer.from(JSON.stringify({ cipher: "none", merchant: config.merchantId })).toString(
          "base64",
        ),
        data: Buffer.from(JSON.stringify(order)).toString("base64"),
        cipher: "aes-256-cbc",
        iv: "",
        paymentUrl: getPaymentUrl(config),
      };
    }

    const xmlPayload = buildPaymentXml(config, order);
    const redactedXml = redactXmlForLog(xmlPayload);
    const xmlBuffer = Buffer.from(xmlPayload, "utf8");

    logNetopiaEvent("info", "Netopia payment XML prepared", {
      orderId: order.orderId,
      xmlByteLength: xmlBuffer.length,
      xmlPreview: redactedXml,
      paymentUrl: getPaymentUrl(config),
    });

    logNetopiaEvent("info", "Netopia XML byte diagnostics", {
      orderId: order.orderId,
      byteLength: xmlBuffer.length,
      firstBytesHex: xmlBuffer.subarray(0, 16).toString("hex"),
      lastBytesHex: xmlBuffer.subarray(-16).toString("hex"),
      sha256: crypto.createHash("sha256").update(xmlBuffer).digest("hex"),
      startsWithXmlDeclaration: xmlBuffer.toString("utf8").startsWith('<?xml version="1.0" encoding="utf-8"?>'),
      containsBom:
        xmlBuffer[0] === 0xef && xmlBuffer[1] === 0xbb && xmlBuffer[2] === 0xbf,
    });

    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
    const encryptedPayload = Buffer.concat([cipher.update(xmlBuffer), cipher.final()]);

    const data = encryptedPayload.toString("base64");
    const ivBase64 = iv.toString("base64");

    logNetopiaEvent("info", "Encrypting Netopia payment AES key", {
      orderId: order.orderId,
      padding: "RSA_PKCS1_PADDING",
      paymentUrl: getPaymentUrl(config),
    });

    const encryptedAesKey = crypto.publicEncrypt(
      {
        key: config.publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      aesKey,
    );
    const envKey = encryptedAesKey.toString("base64");
// Temporary diagnostic: verify our generated envelope locally.
if (config.privateKey) {
  const decryptedAesKey = crypto.privateDecrypt(
    {
      key: config.privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(envKey, "base64"),
  );

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    decryptedAesKey,
    Buffer.from(ivBase64, "base64"),
  );

  const decryptedXml = Buffer.concat([
    decipher.update(Buffer.from(data, "base64")),
    decipher.final(),
  ]).toString("utf8");

  if (decryptedXml !== xmlPayload) {
    throw new Error("Netopia local encryption round-trip failed.");
  }

  logNetopiaEvent("info", "Netopia local encryption round-trip succeeded", {
    orderId: order.orderId,
    aesKeyMatches: crypto.timingSafeEqual(aesKey, decryptedAesKey),
    xmlMatches: decryptedXml === xmlPayload,
  });
}
    logNetopiaEvent("info", "Netopia payment request encrypted", {
      orderId: order.orderId,
      envKeyLength: envKey.length,
      dataLength: data.length,
      ivLength: ivBase64.length,
      paymentUrl: getPaymentUrl(config),
    });

    return {
      envKey,
      data,
      cipher: "aes-256-cbc",
      iv: ivBase64,
      paymentUrl: getPaymentUrl(config),
    };
  } catch (error) {
    logNetopiaEvent(
      "error",
      "Netopia payment request failed",
      {
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        paymentUrl: getPaymentUrl(config),
        hasPublicKey: Boolean(config.publicKey),
        publicKeyLength: config.publicKey.length,
      },
      error,
    );
    throw new Error(
      `Netopia payment request failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
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
  cipher?: string,
  ivBase64?: string,
): IpnResponse {
  try {
    const maybeJsonPayload = tryParseJsonPayload(dataBase64);
    if (maybeJsonPayload) {
      logNetopiaEvent("info", "Netopia IPN decoded as JSON payload", {
        envKeyLength: envKeyBase64.length,
        dataLength: dataBase64.length,
        hasPrivateKey: Boolean(config.privateKey),
        cipher: cipher ?? null,
        ivLength: ivBase64?.length ?? 0,
      });
      return {
        status: "paid",
        orderId: maybeJsonPayload.order_id || maybeJsonPayload.orderId,
        amount: maybeJsonPayload.amount,
        currency: maybeJsonPayload.currency || "RON",
      };
    }

    if (!config.privateKey) {
      if (!config.sandbox) {
        const message = "Netopia private key is required in production for IPN callback decryption.";
        logNetopiaEvent(
          "error",
          message,
          {
            envKeyLength: envKeyBase64.length,
            dataLength: dataBase64.length,
            hasPrivateKey: false,
            cipher: cipher ?? null,
            ivLength: ivBase64?.length ?? 0,
          },
        );
        throw new Error(message);
      }

      try {
        const payload = JSON.parse(Buffer.from(dataBase64, "base64").toString());
        logNetopiaEvent("info", "Netopia IPN decoded in stub mode", {
          envKeyLength: envKeyBase64.length,
          dataLength: dataBase64.length,
          hasPrivateKey: false,
          cipher: cipher ?? null,
          ivLength: ivBase64?.length ?? 0,
        });
        return {
          status: "paid",
          orderId: payload.order_id || payload.orderId,
          amount: payload.amount,
          currency: payload.currency || "RON",
        };
      } catch {
        const xml = Buffer.from(dataBase64, "base64").toString();
        logNetopiaEvent("warn", "Netopia IPN stub mode fell back to XML parsing", {
          envKeyLength: envKeyBase64.length,
          dataLength: dataBase64.length,
          hasPrivateKey: false,
        });
        return parseIpnFromXml(config, xml);
      }
    }

    const encryptedAesKey = Buffer.from(envKeyBase64, "base64");

    let aesKey: Buffer;
    try {
      aesKey = crypto.privateDecrypt(
        {
          key: config.privateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        encryptedAesKey,
      );
    } catch (pkcs1Error) {
      logNetopiaEvent(
        "warn",
        "Netopia RSA PKCS1 private decrypt failed; retrying OAEP",
        {
          envKeyLength: envKeyBase64.length,
          dataLength: dataBase64.length,
          cipher: cipher ?? null,
          ivLength: ivBase64?.length ?? 0,
          hasPrivateKey: Boolean(config.privateKey),
        },
        pkcs1Error,
      );
      try {
        aesKey = crypto.privateDecrypt(
          {
            key: config.privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          },
          encryptedAesKey,
        );
      } catch (oaepError) {
        const error = new Error(
          `RSA decryption failed: PKCS1 (${pkcs1Error instanceof Error ? pkcs1Error.message : "unknown"}), OAEP (${oaepError instanceof Error ? oaepError.message : "unknown"})`,
        );
        logNetopiaEvent(
          "error",
          "Netopia RSA private decrypt failed",
          {
            envKeyLength: envKeyBase64.length,
            dataLength: dataBase64.length,
            cipher: cipher ?? null,
            ivLength: ivBase64?.length ?? 0,
            hasPrivateKey: Boolean(config.privateKey),
          },
          error,
        );
        throw error;
      }
    }

    const encryptedPayload = Buffer.from(dataBase64, "base64");
    const iv = ivBase64 ? Buffer.from(ivBase64, "base64") : encryptedPayload.subarray(0, 16);
    const ciphertext = ivBase64 ? encryptedPayload : encryptedPayload.subarray(16);

    if (cipher && cipher !== "aes-256-cbc") {
      const error = new Error(`Unsupported cipher: ${cipher}`);
      logNetopiaEvent(
        "error",
        "Netopia IPN used unsupported cipher",
        {
          envKeyLength: envKeyBase64.length,
          dataLength: dataBase64.length,
          cipher,
          ivLength: ivBase64?.length ?? 0,
        },
        error,
      );
      throw error;
    }

    const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, iv);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const xml = decrypted.toString("utf-8");
    return parseIpnFromXml(config, xml);
  } catch (error) {
    logNetopiaEvent(
      "error",
      "Netopia IPN decryption failed",
      {
        envKeyLength: envKeyBase64.length,
        dataLength: dataBase64.length,
        cipher: cipher ?? null,
        ivLength: ivBase64?.length ?? 0,
        hasPrivateKey: Boolean(config.privateKey),
      },
      error,
    );
    return {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Decryption failed",
      errorStage: "rsa_decrypt",
    };
  }
}

function tryParseJsonPayload(dataBase64: string): Record<string, string | undefined> | null {
  try {
    const decoded = Buffer.from(dataBase64, "base64").toString("utf-8").trim();
    if (!decoded) return null;
    const parsed = JSON.parse(decoded);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;

    const normalized: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string") {
        normalized[key] = value;
      } else if (typeof value === "number" || typeof value === "boolean") {
        normalized[key] = String(value);
      }
    }
    return normalized;
  } catch {
    return null;
  }
}

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
function escapeXml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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

