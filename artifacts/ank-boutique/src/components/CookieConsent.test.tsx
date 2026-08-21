import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import CookieConsent from "./CookieConsent";

const storageKey = "anks_cookie_consent";

describe("CookieConsent", () => {
  beforeEach(() => {
    localStorage.clear();
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
        necessary: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now(),
      }),
    );

    render(<CookieConsent />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
