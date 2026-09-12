import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CookieConsent from "./CookieConsent";
import { CONSENT_VERSION, CONSENT_MAX_AGE, openCookieSettings, useCookieConsent } from "@/lib/consent";

const storageKey = "anks_cookie_consent";

describe("CookieConsent", () => {
  beforeEach(() => {
    localStorage.clear();
    window.gtag = vi.fn();
  });

  it("asks a first-time visitor for consent", async () => {
    render(<CookieConsent />);

    expect(
      await screen.findByRole("button", { name: "Accept Tot" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Refuz" })).toBeVisible();
  });

  it("stores an accept-all decision and closes the dialog", async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);

    await user.click(await screen.findByRole("button", { name: "Accept Tot" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem(storageKey) ?? "null"),
    ).toMatchObject({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  });

  it("does not reopen when consent was already stored", () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: CONSENT_VERSION,
        necessary: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now(),
      }),
    );

    render(<CookieConsent />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("restores preferences and withdraws all Google consent signals", async () => {
    const user = userEvent.setup();
    function Consumer() {
      const consent = useCookieConsent();
      return <output>{consent.analytics ? "analytics on" : "analytics off"}</output>;
    }
    render(<><CookieConsent /><Consumer /><button onClick={openCookieSettings}>Settings</button></>);
    await user.click(await screen.findByRole("button", { name: "Accept Tot" }));
    expect(screen.getByText("analytics on")).toBeVisible();
    await user.click(screen.getByText("Settings"));
    expect(screen.getByRole("switch", { name: "Cookie-uri de analiză" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("button", { name: "Refuz Tot" }));
    expect(screen.getByText("analytics off")).toBeVisible();
    expect(window.gtag).toHaveBeenLastCalledWith("consent", "update", {
      analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    });
  });

  it.each([
    { version: CONSENT_VERSION, timestamp: Date.now() - CONSENT_MAX_AGE - 1000 },
    { version: 1, timestamp: Date.now() },
    { version: CONSENT_VERSION, timestamp: Date.now(), analytics: "true" },
  ])("requests a new decision for invalid or outdated consent: %j", async (overrides) => {
    localStorage.setItem(storageKey, JSON.stringify({ necessary: true, analytics: true, marketing: true, ...overrides }));
    render(<CookieConsent />);
    expect(await screen.findByRole("button", { name: "Accept Tot" })).toBeVisible();
    expect(window.gtag).toHaveBeenLastCalledWith("consent", "update", expect.objectContaining({ analytics_storage: "denied" }));
  });

  it("saves analytics independently of marketing", async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);
    await user.click(screen.getByRole("button", { name: "Personalizează preferințele" }));
    await user.click(screen.getByRole("switch", { name: "Cookie-uri de analiză" }));
    await user.click(screen.getByRole("button", { name: "Salvează" }));
    expect(window.gtag).toHaveBeenLastCalledWith("consent", "update", {
      analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    });
  });

  it("applies consent changes made in another tab", async () => {
    render(<CookieConsent />);
    localStorage.setItem(storageKey, JSON.stringify({ version: CONSENT_VERSION, necessary: true, analytics: true, marketing: false, timestamp: Date.now() }));
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: storageKey })));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.gtag).toHaveBeenLastCalledWith("consent", "update", expect.objectContaining({ analytics_storage: "granted", ad_storage: "denied" }));
  });

  it("keeps the choice usable when storage is blocked", async () => {
    const user = userEvent.setup();
    render(<><CookieConsent /><button onClick={openCookieSettings}>Settings</button></>);
    const storage = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage blocked"); });
    try {
      await user.click(screen.getByRole("button", { name: "Accept Tot" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      await user.click(screen.getByText("Settings"));
      expect(screen.getByRole("switch", { name: "Cookie-uri de marketing" })).toHaveAttribute("aria-checked", "true");
    } finally {
      storage.mockRestore();
    }
    await user.click(screen.getByRole("button", { name: "Refuz Tot" }));
  });
});
