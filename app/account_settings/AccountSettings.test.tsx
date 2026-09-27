// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { describe, it, expect, afterEach } from "vitest";
import { AccountSettings } from "./AccountSettings";

describe("AccountSettings Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders account settings shell heading and link", () => {
    render(
      <BrowserRouter>
        <AccountSettings />
      </BrowserRouter>
    );

    expect(screen.getByRole("heading", { name: /account settings/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /security & password/i })).toBeTruthy();

    const resetLink = screen.getByRole("link", { name: /reset password via email/i });
    expect(resetLink).toBeTruthy();
    expect(resetLink.getAttribute("href")).toBe("/forgotPassword");
  });
});