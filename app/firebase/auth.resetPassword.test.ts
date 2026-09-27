import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  sendPasswordResetEmail: vi.fn(),
  getAuth: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
  getAuth: mocks.getAuth,
}));

vi.mock("./firebase", () => ({
  auth: {},
}));

import { resetPassword } from "./auth";

describe("resetPassword Firebase Auth Helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls sendPasswordResetEmail with auth instance and trimmed email", async () => {
    mocks.sendPasswordResetEmail.mockResolvedValue(undefined);

    await resetPassword("  user@example.com  ");

    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.anything(),
      "user@example.com"
    );
  });

  it("propagates error when sendPasswordResetEmail fails", async () => {
    const firebaseError = new Error("Auth request failed");
    mocks.sendPasswordResetEmail.mockRejectedValue(firebaseError);

    await expect(resetPassword("user@example.com")).rejects.toThrow(
      "Auth request failed"
    );
  });
});