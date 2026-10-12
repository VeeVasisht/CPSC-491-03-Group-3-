import { describe, expect, it } from "vitest";

import {
  getLoginErrorMessage,
  validateLoginFields,
} from "./login";

describe("validateLoginFields", () => {
  it("accepts valid login information", () => {
    const result = validateLoginFields({
      email: "test@example.com",
      password: "password123",
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("rejects an empty email", () => {
    const result = validateLoginFields({
      email: "",
      password: "password123",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("Email is required.");
  });

  it("rejects an invalid email", () => {
    const result = validateLoginFields({
      email: "not-an-email",
      password: "password123",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe(
      "Enter a valid email address.",
    );
  });

  it("rejects an empty password", () => {
    const result = validateLoginFields({
      email: "test@example.com",
      password: "",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.password).toBe(
      "Password is required.",
    );
  });

  it("rejects an empty email and password", () => {
    const result = validateLoginFields({
      email: "",
      password: "",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("Email is required.");
    expect(result.errors.password).toBe(
      "Password is required.",
    );
  });
});

describe("getLoginErrorMessage", () => {
  it("handles invalid credentials", () => {
    const result = getLoginErrorMessage({
      code: "auth/invalid-credential",
    });

    expect(result).toBe("Invalid email or password.");
  });

  it("handles network errors", () => {
    const result = getLoginErrorMessage({
      code: "auth/network-request-failed",
    });

    expect(result).toBe(
      "Unable to connect. Check your internet connection and try again.",
    );
  });

  it("handles too many attempts", () => {
    const result = getLoginErrorMessage({
      code: "auth/too-many-requests",
    });

    expect(result).toBe(
      "Too many login attempts. Please try again later.",
    );
  });

  it("handles unknown errors", () => {
    const result = getLoginErrorMessage(
      new Error("Unknown"),
    );

    expect(result).toBe(
      "Unable to log in. Please try again.",
    );
  });
});