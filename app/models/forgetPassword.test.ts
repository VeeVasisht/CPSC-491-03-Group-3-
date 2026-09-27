import { describe, expect, it } from "vitest";
import {
  getResetPasswordErrorMessage,
  validateForgetPasswordEmail,
} from "./forgetPassword";

describe("validateForgetPasswordEmail", () => {
  it("rejects an empty email string", () => {
    const result = validateForgetPasswordEmail({ email: "" });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Email address is required.");
  });

  it("rejects whitespace-only email string", () => {
    const result = validateForgetPasswordEmail({ email: "   " });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Email address is required.");
  });

  it("rejects an invalid email format", () => {
    const result = validateForgetPasswordEmail({ email: "invalid-email" });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Enter a valid email address.");
  });

  it("accepts a valid email address", () => {
    const result = validateForgetPasswordEmail({ email: "user@example.com" });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe("getResetPasswordErrorMessage", () => {
  it("handles auth/user-not-found error code", () => {
    const msg = getResetPasswordErrorMessage({ code: "auth/user-not-found" });
    expect(msg).toBe("No account found with this email address.");
  });

  it("handles auth/invalid-email error code", () => {
    const msg = getResetPasswordErrorMessage({ code: "auth/invalid-email" });
    expect(msg).toBe("Enter a valid email address.");
  });

  it("handles auth/too-many-requests error code", () => {
    const msg = getResetPasswordErrorMessage({ code: "auth/too-many-requests" });
    expect(msg).toBe("Too many requests. Please try again later.");
  });

  it("handles auth/network-request-failed error code", () => {
    const msg = getResetPasswordErrorMessage({
      code: "auth/network-request-failed",
    });
    expect(msg).toBe("Unable to connect. Check your internet connection and try again.");
  });

  it("returns fallback message for unknown or unhandled errors", () => {
    const msg = getResetPasswordErrorMessage({ code: "auth/unknown-error" });
    expect(msg).toBe("Unable to send reset email. Please try again.");
  });
});