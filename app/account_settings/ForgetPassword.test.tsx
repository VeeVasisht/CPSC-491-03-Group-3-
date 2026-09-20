// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as authModule from "../firebase/auth";
import { ForgotPassword } from "./ForgetPassword";

vi.mock("../firebase/auth", () => ({
  resetPassword: vi.fn(),
}));

describe("ForgotPassword Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

  it("renders the forgot password form correctly", () => {
    renderComponent();
    expect(screen.getByRole("heading", { name: /reset password/i })).toBeTruthy();
    expect(screen.getByLabelText(/email address/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeTruthy();
  });

  it("shows client-side error on invalid email submission", async () => {
    renderComponent();
    const submitBtn = screen.getByRole("button", { name: /send reset link/i });

    fireEvent.click(submitBtn);

    expect(await screen.findByText(/email address is required/i)).toBeTruthy();
    expect(authModule.resetPassword).not.toHaveBeenCalled();
  });

  it("renders loading state and triggers resetPassword on valid submit", async () => {
    vi.mocked(authModule.resetPassword).mockReturnValue(new Promise<void>(() => {}));
    renderComponent();

    const input = screen.getByLabelText(/email address/i);
    fireEvent.change(input, { target: { value: "test@example.com" } });

    const submitBtn = screen.getByRole("button", { name: /send reset link/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByRole("button", { name: /sending link\.\.\./i })).toBeTruthy();
    expect(authModule.resetPassword).toHaveBeenCalledWith("test@example.com");
  });

  it("renders confirmation banner upon successful reset email dispatch", async () => {
    vi.mocked(authModule.resetPassword).mockResolvedValue(undefined);
    renderComponent();

    const input = screen.getByLabelText(/email address/i);
    fireEvent.change(input, { target: { value: "test@example.com" } });

    const submitBtn = screen.getByRole("button", { name: /send reset link/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/password reset link sent! check your inbox for instructions\./i)
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: /return to log in/i })).toBeTruthy();
  });

  it("renders error alert banner on backend/Firebase failure", async () => {
    vi.mocked(authModule.resetPassword).mockRejectedValue({
      code: "auth/user-not-found",
    });
    renderComponent();

    const input = screen.getByLabelText(/email address/i);
    fireEvent.change(input, { target: { value: "notfound@example.com" } });

    const submitBtn = screen.getByRole("button", { name: /send reset link/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/no account found with this email address\./i)
    ).toBeTruthy();
  });
});