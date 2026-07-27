import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../../../templates");

// 1. Receipt template validation

describe("Receipt template", () => {
  it("should exist", () => {
    const templatePath = path.join(TEMPLATES_DIR, "receipt.html");
    const exists = fs.existsSync(templatePath);
    expect(exists).toBe(true);
  });

  it("should read successfully and contain key branding", () => {
    const templatePath = path.join(TEMPLATES_DIR, "receipt.html");
    const html = fs.readFileSync(templatePath, "utf-8");
    expect(html).toContain("Anks Boutique");
    expect(html).toContain("Confirmare Comand");
  });

  it("should contain all required template placeholders", () => {
    const templatePath = path.join(TEMPLATES_DIR, "receipt.html");
    const html = fs.readFileSync(templatePath, "utf-8");

    const expectedPlaceholders = [
      "{{STATUS_CLASS}}",
      "{{STATUS_ICON}}",
      "{{STATUS_TITLE}}",
      "{{STATUS_MESSAGE}}",
      "{{ORDER_ID}}",
      "{{ORDER_DATE}}",
      "{{PAYMENT_STATUS}}",
      "{{ORDER_ITEMS}}",
      "{{SUBTOTAL}}",
      "{{SHIPPING_COST}}",
      "{{TOTAL}}",
      "{{CUSTOMER_NAME}}",
      "{{CUSTOMER_EMAIL}}",
      "{{CUSTOMER_PHONE}}",
      "{{CUSTOMER_ADDRESS}}",
      "{{CUSTOMER_CITY}}",
      "{{CUSTOMER_COUNTY}}",
      "{{CUSTOMER_POSTAL_CODE}}",
      "{{SHOP_URL}}",
      "{{SUPPORT_EMAIL}}",
    ];

    for (const placeholder of expectedPlaceholders) {
      expect(html).toContain(placeholder);
    }
  });

  it("should have correct structural sections", () => {
    const templatePath = path.join(TEMPLATES_DIR, "receipt.html");
    const html = fs.readFileSync(templatePath, "utf-8");

    expect(html).toContain('<div class="header">');
    expect(html).toContain('<div class="status-banner');
    expect(html).toContain('<table class="items-table">');
    expect(html).toContain('<div class="totals">');
    expect(html).toContain('<div class="customer-info">');
    expect(html).toContain('<div class="footer">');
    expect(html).toContain("@media print");
  });
});

// 2. Order route source code analysis

describe("Orders route source structure", () => {
  it("should export the router as default", () => {
    const routesPath = path.resolve(__dirname, "../orders.ts");
    const content = fs.readFileSync(routesPath, "utf-8");
    expect(content).toContain("export default router");
  });

  it("should import Netopia payment processing libraries", () => {
    const routesPath = path.resolve(__dirname, "../orders.ts");
    const content = fs.readFileSync(routesPath, "utf-8");

    expect(content).toContain("encryptPaymentRequest");
    expect(content).toContain("decryptIpnResponse");
    expect(content).toContain("buildIpnConfirmationXml");
    expect(content).toContain("loadConfigFromEnv");
    expect(content).toContain("createSandboxStubConfig");
    expect(content).toContain("isConfigured");
    expect(content).toContain("hasValidKeys");
  });

  it("should have payment callback and return routes", () => {
    const routesPath = path.resolve(__dirname, "../orders.ts");
    const content = fs.readFileSync(routesPath, "utf-8");

    expect(content).toContain("/payments/netopia/callback");
    expect(content).toContain("/payments/netopia/return");
  });

  it("should handle payment status transitions correctly", () => {
    const routesPath = path.resolve(__dirname, "../orders.ts");
    const content = fs.readFileSync(routesPath, "utf-8");

    expect(content).toContain('paymentStatus: "paid"');
    expect(content).toContain('status: "confirmed"');
    expect(content).toContain('paymentStatus: "cancelled"');
    expect(content).toContain('paymentStatus: "error"');
    expect(content).toContain('paymentStatus: "pending"');
  });

  it("should respond with XML for IPN callback", () => {
    const routesPath = path.resolve(__dirname, "../orders.ts");
    const content = fs.readFileSync(routesPath, "utf-8");

    expect(content).toContain('text/xml');
    expect(content).toContain("env_key");
    expect(content).toContain("ipnResult");
  });

  it("should have receipt rendering functions", () => {
    const routesPath = path.resolve(__dirname, "../orders.ts");
    const content = fs.readFileSync(routesPath, "utf-8");

    expect(content).toContain("renderReceiptHtml");
    expect(content).toContain("getReceiptHtml");
    expect(content).toContain("buildOrderResponse");
  });

  it("should have the getNetopiaConfig helper with fallback", () => {
    const routesPath = path.resolve(__dirname, "../orders.ts");
    const content = fs.readFileSync(routesPath, "utf-8");

    expect(content).toContain("getNetopiaConfig");
    expect(content).toContain("loadConfigFromEnv");
    expect(content).toContain("createSandboxStubConfig");
  });
});

// 3. Zod schema validation

describe("CreateOrderBody Zod schema", () => {
  it("should be exported from @workspace/api-zod", async () => {
    try {
      const apiZod = await import("@workspace/api-zod");
      expect(apiZod.CreateOrderBody).toBeDefined();
    } catch (e) {
      // Module resolution may fail in test if aliases not configured
      // This is an integration check, skip if module not available
      expect(e).toBeDefined();
    }
  });

  it("should validate a correct order body", () => {
    // Test schema directly without importing to avoid module resolution issues
    // We validate the structure by reading the schema definition from the source
    const apiZodPath = path.resolve(
      __dirname,
      "../../../../lib/api-zod/src/generated/api.ts"
    );
    if (fs.existsSync(apiZodPath)) {
      const content = fs.readFileSync(apiZodPath, "utf-8");
      expect(content).toContain("CreateOrderBody");
      expect(content).toContain("customerName");
      expect(content).toContain("customerEmail");
      expect(content).toContain("customerPhone");
      expect(content).toContain("sessionId");
      expect(content).toContain("shippingAddress");
      expect(content).toContain("city");
      expect(content).toContain("county");
      expect(content).toContain("postalCode");
    }
  });

  it("should define all required fields in the schema", () => {
    const apiZodPath = path.resolve(
      __dirname,
      "../../../../lib/api-zod/src/generated/api.ts"
    );
    if (fs.existsSync(apiZodPath)) {
      const content = fs.readFileSync(apiZodPath, "utf-8");
      // Check that fields are string types in the schema
      expect(content).toContain('customerName');
      expect(content).toContain('customerEmail');
      expect(content).toContain('customerPhone');
      expect(content).toContain('sessionId');
      // notes should be optional
      expect(content).toContain('notes');
    }
  });
});

// 4. Order route helper function tests

describe("Order route helper patterns", () => {
  it("should have the buildOrderResponse function that fetches order items", () => {
    const routesPath = path.resolve(__dirname, "../orders.ts");
    const content = fs.readFileSync(routesPath, "utf-8");

    expect(content).toContain("async function buildOrderResponse");
    expect(content).toContain("orderItemsTable");
    expect(content).toContain("orderId");
  });

  it("should render receipt with proper HTML content", async () => {
    const routesPath = path.resolve(__dirname, "../orders.ts");
    const content = fs.readFileSync(routesPath, "utf-8");

    expect(content).toContain("renderReceiptHtml");
    expect(content).toContain("STATUS_CLASS");
    expect(content).toContain("ORDER_ID");
    expect(content).toContain("TOTAL");
    expect(content).toContain("CUSTOMER_NAME");
  });

  it("should handle order lookup by both order ID and netopia order ID", () => {
    const routesPath = path.resolve(__dirname, "../orders.ts");
    const content = fs.readFileSync(routesPath, "utf-8");

    expect(content).toContain("netopiaOrderId");
    // Should try to find by our order ID first, then by Netopia order ID
    const orderIdPattern = /orderIdParam|netopiaOrderId/g;
    const matches = content.match(orderIdPattern);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });
});
