# Netopia "Decriptarea datelor a eșuat" Fix Plan

## Steps

- [x] 1. Analyze codebase (netopia.ts, orders.ts, checkout.tsx, app.ts, build.mjs)
- [x] 2. Create plan and get approval

### Implementation

- [x] 3. **netopia.ts — Add debug logging to `loadConfigFromEnv()`**
  - Log key loading status, key length, merchant ID, sandbox flag
  - Help diagnose if keys are loaded correctly

- [x] 4. **netopia.ts — Add Node 22+ RSA padding fallback in `decryptIpnResponse()`**
  - Try `RSA_PKCS1_PADDING` first, catch error and retry with `RSA_PKCS1_OAEP_PADDING`

- [x] 5. **netopia.ts — Add validation + debug logging in `encryptPaymentRequest()`**
  - Log the XML payload (without sensitive data), key status, encryption params

- [x] 6. **netopia.ts — Add safeguard comment for `<signature>` vs `apiKey`**
  - Clarify that `signature` must use `merchantId`, never `apiKey`

- [x] 7. **orders.ts — Add logging in callback handler**
  - Log env_key length, data length, decryption result

- [ ] 8. **Rebuild and test**
  - Run `node ./build.mjs` in artifacts/api-server

