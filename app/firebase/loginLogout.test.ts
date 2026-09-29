import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

/**
 * Unit tests for Person 2 Sprint 1 login/logout.
 *
 * Firebase is mocked so these tests do not need
 * a real Firebase connection or emulator.
 */

const mocks = vi.hoisted(() => ({
  signInWithEmailAndPassword: vi.fn(),
  firebaseSignOut: vi.fn(),

  auth: {
    name: "mock-auth",
  },

  db: {
    name: "mock-db",
  },
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword:
    mocks.signInWithEmailAndPassword,
  signOut: mocks.firebaseSignOut,
  sendPasswordResetEmail: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

vi.mock("./firebase", () => ({
  auth: mocks.auth,
  db: mocks.db,
}));

import {
  signIn,
  signOut,
} from "./auth";

describe("signIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs in with a trimmed email and password", async () => {
    const fakeCredential = {
      user: {
        uid: "user-123",
        email: "test@example.com",
      },
    };

    mocks.signInWithEmailAndPassword.mockResolvedValue(
      fakeCredential,
    );

    const result = await signIn(
      "  test@example.com  ",
      "password123",
    );

    expect(
      mocks.signInWithEmailAndPassword,
    ).toHaveBeenCalledTimes(1);

    expect(
      mocks.signInWithEmailAndPassword,
    ).toHaveBeenCalledWith(
      mocks.auth,
      "test@example.com",
      "password123",
    );

    expect(result).toBe(fakeCredential);
  });

  it("preserves Firebase login errors", async () => {
    const authError = {
      code: "auth/invalid-credential",
    };

    mocks.signInWithEmailAndPassword.mockRejectedValue(
      authError,
    );

    await expect(
      signIn(
        "test@example.com",
        "wrong-password",
      ),
    ).rejects.toBe(authError);
  });
});

describe("signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs the current user out", async () => {
    mocks.firebaseSignOut.mockResolvedValue(
      undefined,
    );

    await expect(
      signOut(),
    ).resolves.toBeUndefined();

    expect(
      mocks.firebaseSignOut,
    ).toHaveBeenCalledTimes(1);

    expect(
      mocks.firebaseSignOut,
    ).toHaveBeenCalledWith(
      mocks.auth,
    );
  });

  it("preserves Firebase logout errors", async () => {
    const authError = new Error(
      "Logout failed",
    );

    mocks.firebaseSignOut.mockRejectedValue(
      authError,
    );

    await expect(
      signOut(),
    ).rejects.toBe(authError);
  });
});