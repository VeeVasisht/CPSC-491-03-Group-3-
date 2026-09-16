import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { describe, it, expect } from "vitest";
import AccountSettings from "./AccountSettings";

describe("AccountSettings Component", () => {
  it("renders account settings shell heading and link", () => {
    render(
      <BrowserRouter>
        <AccountSettings />
      </BrowserRouter>
    );

    expect(screen.getByRole("heading", { name: /account settings/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /security & password/i })).toBeInTheDocument();

    const resetLink = screen.getByRole("link", { name: /reset password via email/i });
    expect(resetLink).toBeInTheDocument();
    expect(resetLink).toHaveAttribute("href", "/forget-password");
  });
});