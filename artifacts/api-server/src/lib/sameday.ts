import { logger } from "./logger";

type JsonObject = Record<string, unknown>;

export interface SamedayOohLocation {
  oohId: number;
  oohType: number;
  name: string;
  county: string;
  city: string;
  address: string;
  postalCode: string | null;
  lat: number;
  lng: number;
  supportedPayment: number;
}

export interface CreateAwbInput {
  orderId: number;
  deliveryMethod: "home" | "easybox";
  oohId?: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: string | null;
  city?: string | null;
  county?: string | null;
  postalCode?: string | null;
  insuredValue: string;
  packageWeight: number;
}

export interface SamedayAwb {
  awbNumber: string;
  awbCost: number | null;
  pdfLink: string | null;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for Sameday integration.`);
  return value;
}

function apiBaseUrl(): string {
  return (process.env["SAMEDAY_API_URL"]?.trim() || "https://api.sameday.ro").replace(/\/$/, "");
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function authenticate(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60_000) return cachedToken.value;

  const response = await fetch(`${apiBaseUrl()}/api/authenticate?remember_me=1`, {
    method: "POST",
    headers: {
      "X-AUTH-USERNAME": requiredEnv("SAMEDAY_USERNAME"),
      "X-AUTH-PASSWORD": requiredEnv("SAMEDAY_PASSWORD"),
      Accept: "application/json",
    },
  });
  const body = await parseResponse(response);
  if (!response.ok) {
    logger.error({ status: response.status, body }, "Sameday authentication failed");
    throw new Error("Autentificarea Sameday a eșuat.");
  }

  const payload = body as JsonObject;
  const token = typeof payload?.token === "string" ? payload.token : "";
  if (!token) throw new Error("Sameday did not return an authentication token.");

  const expiryText = typeof payload.expire_at_utc === "string" ? payload.expire_at_utc : "";
  const parsedExpiry = expiryText ? Date.parse(`${expiryText.replace(" ", "T")}Z`) : Number.NaN;
  cachedToken = {
    value: token,
    expiresAt: Number.isFinite(parsedExpiry) ? parsedExpiry : Date.now() + 11 * 60 * 60_000,
  };
  return token;
}

async function samedayRequest(path: string, init: RequestInit = {}, retry = true): Promise<unknown> {
  const token = await authenticate();
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
      "X-AUTH-TOKEN": token,
    },
  });

  if (response.status === 401 && retry) {
    cachedToken = null;
    return samedayRequest(path, init, false);
  }

  const body = await parseResponse(response);
  if (!response.ok) {
    logger.error({ status: response.status, path, body }, "Sameday API request failed");
    throw new Error(`Cererea Sameday a eșuat (${response.status}).`);
  }
  return body;
}

export async function listOohLocations(filters: {
  oohId?: number;
  county?: string;
  city?: string;
  search?: string;
  page?: number;
  countPerPage?: number;
}): Promise<{ total: number; currentPage: number; pages: number; data: SamedayOohLocation[] }> {
  const query = new URLSearchParams({
    countryCode: "RO",
    listingType: "0",
    page: String(filters.page ?? 1),
    countPerPage: String(Math.min(filters.countPerPage ?? 100, 500)),
  });
  if (filters.oohId) query.set("oohList", String(filters.oohId));
  if (filters.county) query.set("county", filters.county);
  if (filters.city) query.set("city", filters.city);
  if (filters.search) query.set("name", filters.search);

  const body = (await samedayRequest(`/api/client/ooh-locations?${query}`)) as JsonObject;
  const rawData = Array.isArray(body?.data) ? body.data : [];
  const data = rawData
    .filter((item): item is JsonObject => !!item && typeof item === "object")
    .map((item) => ({
      oohId: Number(item.oohId),
      oohType: Number(item.oohType),
      name: String(item.name ?? ""),
      county: String(item.county ?? ""),
      city: String(item.city ?? ""),
      address: String(item.address ?? ""),
      postalCode: item.postalCode == null ? null : String(item.postalCode),
      lat: Number(item.lat),
      lng: Number(item.lng),
      supportedPayment: Number(item.supportedPayment ?? 0),
    }))
    .filter((item) => Number.isFinite(item.oohId) && item.oohType === 0);

  return {
    total: Number(body?.total ?? data.length),
    currentPage: Number(body?.currentPage ?? filters.page ?? 1),
    pages: Number(body?.pages ?? 1),
    data,
  };
}

export async function createAwb(input: CreateAwbInput): Promise<SamedayAwb> {
  if (input.deliveryMethod === "easybox" && !input.oohId) {
    throw new Error("Comanda nu are un easybox selectat.");
  }

  const service = input.deliveryMethod === "easybox"
    ? process.env["SAMEDAY_LOCKER_SERVICE_ID"]?.trim() || "15"
    : process.env["SAMEDAY_HOME_SERVICE_ID"]?.trim() || "7";
  const recipient: JsonObject = {
    name: input.customerName,
    phoneNumber: input.customerPhone,
    email: input.customerEmail,
    personType: "0",
  };
  if (input.deliveryMethod === "home") {
    Object.assign(recipient, {
      county: input.county,
      city: input.city,
      address: input.shippingAddress,
      postalCode: input.postalCode,
    });
  }

  const payload: JsonObject = {
    packageType: "0",
    insuredValue: input.insuredValue,
    cashOnDelivery: "0",
    awbPayment: "1",
    thirdPartyPickup: "0",
    pickupPoint: requiredEnv("SAMEDAY_PICKUP_POINT_ID"),
    contactPerson: requiredEnv("SAMEDAY_CONTACT_PERSON_ID"),
    service,
    awbRecipient: recipient,
    packageWeight: String(input.packageWeight),
    packageNumber: "1",
    parcels: [{ weight: String(input.packageWeight) }],
    clientInternalReference: `ANK-${input.orderId}`,
  };
  if (input.deliveryMethod === "easybox") payload.oohLastMile = String(input.oohId);

  const body = (await samedayRequest("/api/awb", {
    method: "POST",
    body: JSON.stringify(payload),
  })) as JsonObject;
  const awbNumber = typeof body?.awbNumber === "string" ? body.awbNumber : "";
  if (!awbNumber) throw new Error("Sameday did not return an AWB number.");
  return {
    awbNumber,
    awbCost: body.awbCost == null ? null : Number(body.awbCost),
    pdfLink: typeof body.pdfLink === "string" ? body.pdfLink : null,
  };
}
