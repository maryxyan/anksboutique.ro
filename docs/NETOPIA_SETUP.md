# Netopia (MobilPay) Payment Processor Integration Guide

## Overview

This document describes how to integrate the Netopia (formerly MobilPay) payment processor into the Anks Boutique e-commerce platform. Netopia is a Romanian payment gateway that supports card payments, and it's the primary payment method for this store.

## Architecture

```
[Customer Browser]                   [Anks Boutique Server]              [Netopia]
       │                                      │                              │
       │── POST /api/orders ──────────────────│                              │
       │    (customer info, cart items)        │                              │
       │                                      │── Generate XML order ────────│
       │                                      │── Encrypt (AES + RSA) ──────│
       │                                      │                              │
       │◄── { orderId, paymentUrl,            │                              │
       │       env_key, data } ───────────────│                              │
       │                                      │                              │
       │── POST (form submit) ──────────────────────────────────────────────▶│
       │    (env_key + data)                   │                              │
       │                                      │                              │
       │                                      │◄── IPN callback ─────────────│
       │                                      │    (POST /payments/          │
       │                                      │     netopia/callback)        │
       │                                      │                              │
       │◄── Redirect (return URL) ───────────────────────────────────────────│
       │                                      │                              │
       │── GET /payments/netopia/return ──────│                              │
       │◄── Receipt page ─────────────────────│                              │
       │                                      │                              │
```

## Prerequisites

### 1. Netopia Merchant Account

1. Register at [https://netopia-payments.ro](https://netopia-payments.ro)
2. Complete the onboarding process to get your **Merchant ID**
3. Download your RSA keys:
   - **Public key**: Used to encrypt payment requests sent to Netopia
   - **Private key**: Used to decrypt IPN callbacks received from Netopia

### 2. RSA Key Format

The RSA keys should be in PEM format:

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----
```

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQ...
-----END PRIVATE KEY-----
```

## Environment Configuration

### Required Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/anksboutique` |
| `PORT` | API server port | `8080` |
| `APP_BASE_URL` | Public URL of your API (used for Netopia callback URLs) | `https://api.anksboutique.ro` |
| `FRONTEND_URL` | Public URL of your frontend | `https://anksboutique.ro` |
| `NETOPIA_MERCHANT_ID` | Your merchant ID from Netopia | `MERCHANT_12345` |
| `NETOPIA_API_KEY` | Your Netopia API key/token for newer JSON APIs; the legacy XML checkout uses `NETOPIA_MERCHANT_ID` as `<signature>` | `if4aeDyBGwfncloh9986Cth7JmYTrFA8fX3XRlrgXTZMWus_B3X9zx1Sie5N` |
| `NETOPIA_PUBLIC_KEY_PEM` | Inline Netopia RSA public key in PEM format. Takes precedence over `NETOPIA_PUBLIC_KEY_PATH`. | `-----BEGIN PUBLIC KEY-----...` |
| `NETOPIA_PUBLIC_KEY_PATH` | Path to your Netopia RSA public key | `file:///etc/ssl/netopia/public.pem` |
| `NETOPIA_PRIVATE_KEY_PEM` | Inline Netopia RSA private key in PEM format. Takes precedence over `NETOPIA_PRIVATE_KEY_PATH`. | `-----BEGIN PRIVATE KEY-----...` |
| `NETOPIA_PRIVATE_KEY_PATH` | Path to your Netopia RSA private key | `file:///etc/ssl/netopia/private.pem` |
| `NETOPIA_SANDBOX` | Use sandbox environment | `true` (development) / `false` (production) |

### Key File Paths

You can reference key files using the `file://` prefix:

```
NETOPIA_PUBLIC_KEY_PATH="file:///C:/Keys/netopia-public.pem"
NETOPIA_PRIVATE_KEY_PATH="file:///C:/Keys/netopia-private.pem"
```

Or you can store the PEM directly in the environment:

```
NETOPIA_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"

NETOPIA_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQ...
-----END PRIVATE KEY-----"
```

## Development / Sandbox Mode

When `NETOPIA_SANDBOX=true`:

- Payment requests are sent to `https://sandboxsecure.mobilpay.ro`
- Use **test card numbers** provided by Netopia documentation
- No real money is moved

If RSA keys are not configured, the system falls back to **stub mode** where:
- `env_key` is a base64-encoded JSON with `{ cipher: "none", merchant: "TEST_MERCHANT" }`
- `data` is a base64-encoded JSON of the order data
- This allows frontend development without Netopia credentials

## API Endpoints

### POST /api/orders — Create Order & Initiate Payment

**Request:**
```json
{
  "customerName": "Maria Popescu",
  "customerEmail": "maria@example.com",
  "customerPhone": "+40720123456",
  "shippingAddress": "Strada Florilor 12",
  "city": "București",
  "county": "București",
  "postalCode": "010101",
  "sessionId": "abc-123-def",
  "notes": ""
}
```

**Response:**
```json
{
  "orderId": 42,
  "paymentUrl": "https://sandboxsecure.mobilpay.ro",
  "netopiaFormData": {
    "env_key": "base64-encrypted-aes-key",
    "data": "base64-encrypted-payload"
  }
}
```

The submitted payment form also includes `cipher=aes-256-cbc` and the base64 IV as `iv`.

### POST /api/payments/netopia/callback — IPN Handler

Netopia sends a POST request to this URL with `env_key` and `data` fields (form-urlencoded).

**Success response (XML):**
```xml
<?xml version="1.0" encoding="utf-8"?>
<crc></crc>
```

**Error response (XML):**
```xml
<?xml version="1.0" encoding="utf-8"?>
<crc error_type="1" error_code="1">Error message</crc>
```

### GET /api/payments/netopia/return — Return URL

After the customer completes payment on Netopia's page, they are redirected here. This displays the order receipt page showing payment status.

## Testing

### Sandbox Test Cards

Use these test card numbers in the sandbox environment:

| Card Number | Expiry | CVV | Result |
|---|---|---|---|
| `4111111111111111` | Any future date | Any 3 digits | Successful payment |
| `4000000000000002` | Any future date | Any 3 digits | Declined payment |

### Testing the Full Flow

1. Start the API server and frontend
2. Add items to cart on the frontend
3. Go to checkout, fill in customer info, submit
4. You should be redirected to Netopia sandbox payment page
5. Enter a test card number and complete the payment
6. You'll be redirected back to the receipt page
7. Check the admin panel to see the order status updated

## Troubleshooting

### IPN Callback Not Received

Ensure your `APP_BASE_URL` is set correctly and is publicly accessible. Netopia needs to reach your `/api/payments/netopia/callback` endpoint.

### XML Parsing Errors

If you see XML parsing errors in the logs, check:
- The RSA keys are in the correct PEM format
- The merchant ID is correct
- The environment variables are properly loaded

### Payment Status Not Updated

If the payment succeeds but the order status remains "pending":
1. Check the server logs for IPN callback errors
2. Verify the private key matches the public key provided to Netopia
3. Check that the callback URL is accessible from the internet

## Security Considerations

1. **Never commit RSA private keys** to version control
2. **Always validate IPN callbacks** by decrypting and verifying the signature
3. **Use HTTPS** in production to encrypt all communications
4. **Verify the amount** in the IPN matches the order amount in your database
5. **Implement idempotency** for IPN callbacks to prevent duplicate order updates

## Key Files Reference

| File | Purpose |
|---|---|
| `artifacts/api-server/src/lib/netopia.ts` | Core encryption, decryption, XML handling |
| `artifacts/api-server/src/routes/orders.ts` | Order creation & IPN callback routes |
| `artifacts/api-server/templates/receipt.html` | Payment receipt HTML template |
| `.env.example` | Environment variable template |
| `docs/NETOPIA_SETUP.md` | This file |

## References

- [Netopia Payments Official Website](https://netopia-payments.ro)
- [Netopia Integration Documentation](https://docs.netopia-payments.ro)
- [Netopia Sandbox Environment](https://sandboxsecure.mobilpay.ro)

