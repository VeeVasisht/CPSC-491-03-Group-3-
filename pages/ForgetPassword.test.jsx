import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ForgotPassword from "./ForgotPassword";
import * as authModule from "../app/firebase/auth";

vi.mock("../app/firebase/auth", () => ({
  resetPassword: vi.fn(),
}));

describe("ForgotPassword Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

  it("renders the forgot password form correctly", () => {
    renderComponent();
    expect(screen.getByRole("heading", { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("shows client-side error on invalid email submission", async () => {
    renderComponent();
    const submitBtn = screen.getByRole("button", { name: /send reset link/i });

    fireEvent.click(submitBtn);

    expect(await screen.findByText(/email address is required/i)).toBeInTheDocument();
    expect(authModule.resetPassword).not.toHaveBeenCalled();
  });

  it("renders loading state and triggers resetPassword on valid submit", async () => {
    vi.mocked(authModule.resetPassword).mockReturnValue(new Promise(() => {}));
    renderComponent();

    const input = screen.getByLabelText(/email address/i);
    fireEvent.change(input, { target: { value: "test@example.com" } });

    const submitBtn = screen.getByRole("button", { name: /send reset link/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByRole("button", { name: /sending link\.\.\./i })).toBeInTheDocument();
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
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return to log in/i })).toBeInTheDocument();
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
    ).toBeInTheDocument();
  });
});