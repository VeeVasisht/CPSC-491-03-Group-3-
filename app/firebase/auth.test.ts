import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Unit tests for app/firebase/auth.ts.
 *
 * These tests DO NOT use the Firebase emulators.
 * Firebase Auth, Firestore, and the local Firebase config module are mocked.
 */

const mocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  deleteUser: vi.fn(),

  doc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),

  auth: { name: "mock-auth" },
  db: { name: "mock-db" },
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: mocks.createUserWithEmailAndPassword,
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  deleteUser: mocks.deleteUser,
}));

vi.mock("firebase/firestore/lite", () => ({
  doc: mocks.doc,
  setDoc: mocks.setDoc,
  serverTimestamp: mocks.serverTimestamp,
}));

vi.mock("./firebase", () => ({
  auth: mocks.auth,
  db: mocks.db,
}));

import { createAccount } from "./auth";

describe("createAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an Auth user and matching Firestore profile", async () => {
    const fakeUser = {
      uid: "user-123",
      email: "test@example.com",
    };

    const fakeCredential = {
      user: fakeUser,
    };

    const fakeDocRef = {
      path: "users/user-123",
    };

    const fakeTimestamp = {
      seconds: 123,
      nanoseconds: 0,
    };

    mocks.createUserWithEmailAndPassword.mockResolvedValue(fakeCredential);
    mocks.doc.mockReturnValue(fakeDocRef);
    mocks.serverTimestamp.mockReturnValue(fakeTimestamp);
    mocks.setDoc.mockResolvedValue(undefined);

    const result = await createAccount(
      "  test@example.com  ",
      "password123",
      "  Robert  "
    );

    expect(mocks.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(mocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      mocks.auth,
      "test@example.com",
      "password123"
    );

    expect(mocks.doc).toHaveBeenCalledTimes(1);
    expect(mocks.doc).toHaveBeenCalledWith(
      mocks.db,
      "users",
      "user-123"
    );

    expect(mocks.serverTimestamp).toHaveBeenCalledTimes(2);

    expect(mocks.setDoc).toHaveBeenCalledTimes(1);
    expect(mocks.setDoc).toHaveBeenCalledWith(
      fakeDocRef,
      {
        displayName: "Robert",
        bio: "",
        createdAt: fakeTimestamp,
        updatedAt: fakeTimestamp,
      }
    );

    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(result).toBe(fakeCredential);
  });

  it("removes the Auth account if Firestore profile creation fails", async () => {
    const fakeUser = {
      uid: "user-123",
      email: "test@example.com",
    };

    const fakeCredential = {
      user: fakeUser,
    };

    const fakeDocRef = {
      path: "users/user-123",
    };

    const firestoreError = new Error("Firestore write failed");

    mocks.createUserWithEmailAndPassword.mockResolvedValue(fakeCredential);
    mocks.doc.mockReturnValue(fakeDocRef);
    mocks.serverTimestamp.mockReturnValue({});
    mocks.setDoc.mockRejectedValue(firestoreError);
    mocks.deleteUser.mockResolvedValue(undefined);

    await expect(
      createAccount(
        "test@example.com",
        "password123",
        "Robert"
      )
    ).rejects.toThrow("Firestore write failed");

    expect(mocks.deleteUser).toHaveBeenCalledTimes(1);
    expect(mocks.deleteUser).toHaveBeenCalledWith(fakeUser);
  });

  it("does not attempt Firestore creation if Firebase Auth fails", async () => {
    const authError = new Error("Email already in use");

    mocks.createUserWithEmailAndPassword.mockRejectedValue(authError);

    await expect(
      createAccount(
        "test@example.com",
        "password123",
        "Robert"
      )
    ).rejects.toThrow("Email already in use");

    expect(mocks.doc).not.toHaveBeenCalled();
    expect(mocks.setDoc).not.toHaveBeenCalled();
    expect(mocks.serverTimestamp).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("preserves the Firestore error even if Auth rollback also fails", async () => {
    const fakeUser = {
      uid: "user-123",
      email: "test@example.com",
    };

    const fakeCredential = {
      user: fakeUser,
    };

    const firestoreError = new Error("Firestore write failed");

    mocks.createUserWithEmailAndPassword.mockResolvedValue(fakeCredential);
    mocks.doc.mockReturnValue({ path: "users/user-123" });
    mocks.serverTimestamp.mockReturnValue({});
    mocks.setDoc.mockRejectedValue(firestoreError);
    mocks.deleteUser.mockRejectedValue(new Error("Rollback failed"));

    await expect(
      createAccount(
        "test@example.com",
        "password123",
        "Robert"
      )
    ).rejects.toBe(firestoreError);

    expect(mocks.deleteUser).toHaveBeenCalledWith(fakeUser);
  });
});