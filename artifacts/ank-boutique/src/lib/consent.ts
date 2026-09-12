import { useSyncExternalStore } from "react";

export const STORAGE_KEY = "anks_cookie_consent";
export const CONSENT_VERSION = 2;
// Product policy: ask again after 180 days, or when the policy version changes.
export const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
const CHANGE_EVENT = "anks:consent-change";
export const SETTINGS_EVENT = "anks:cookie-settings";

interface ConsentState {
  version: number;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let memoryConsent: ConsentState | null = null;

export function loadConsent(): ConsentState | null {
  let value: unknown = memoryConsent;
  try {
    if (!value) value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
  } catch {
    // Storage may be unavailable; retain this page's choice in memory.
  }
  if (value && typeof value === "object") {
    const state = value as ConsentState;
    if (state.version === CONSENT_VERSION && state.necessary === true &&
      typeof state.analytics === "boolean" && typeof state.marketing === "boolean" &&
      typeof state.timestamp === "number" && Number.isFinite(state.timestamp) &&
      state.timestamp <= Date.now() && Date.now() - state.timestamp < CONSENT_MAX_AGE) return state;
  }
  return null;
}

export function applyConsent(consent = loadConsent()) {
  window.gtag?.("consent", "update", {
    analytics_storage: consent?.analytics ? "granted" : "denied",
    ad_storage: consent?.marketing ? "granted" : "denied",
    ad_user_data: consent?.marketing ? "granted" : "denied",
    ad_personalization: consent?.marketing ? "granted" : "denied",
  });
}

export function saveConsent(analytics: boolean, marketing: boolean) {
  const state: ConsentState = {
    version: CONSENT_VERSION, necessary: true, analytics, marketing, timestamp: Date.now(),
  };
  memoryConsent = null;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    memoryConsent = state;
  }
  applyConsent(state);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}

function subscribe(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function useCookieConsent() {
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(loadConsent()), () => "null");
  const consent: ConsentState | null = JSON.parse(snapshot);
  return { hasConsent: !!consent, analytics: consent?.analytics ?? false, marketing: consent?.marketing ?? false };
}
