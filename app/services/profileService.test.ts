// app/services/profileService.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

// All mock state goes in vi.hoisted so it exists before the mocks run.
const mocks = vi.hoisted(() => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => "SERVER_TS"),
  authState: { currentUser: null as { uid: string } | null },
}));

vi.mock("firebase/firestore", () => ({
  doc: mocks.doc,
  getDoc: mocks.getDoc,
  updateDoc: mocks.updateDoc,
  setDoc: mocks.setDoc,
  serverTimestamp: mocks.serverTimestamp,
}));

vi.mock("../firebase/firebase", () => ({
  auth: mocks.authState,
  db: {},
}));

import { getCurrentProfile, updateCurrentProfile } from "./profileService";

describe("getCurrentProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authState.currentUser = null;
  });

  it("returns an error when no user is signed in", async () => {
    const result = await getCurrentProfile();
    expect(result.status).toBe("error");
    expect(mocks.getDoc).not.toHaveBeenCalled();
  });

  it("returns not-found when the profile document doesn't exist", async () => {
    mocks.authState.currentUser = { uid: "user123" };
    mocks.getDoc.mockResolvedValue({ exists: () => false });

    const result = await getCurrentProfile();
    expect(result.status).toBe("not-found");
  });

  it("returns the mapped profile on a successful read", async () => {
    mocks.authState.currentUser = { uid: "user123" };
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      id: "user123",
      data: () => ({
        displayName: "Reign",
        bio: "CS student",
        createdAt: { toMillis: () => 1000 },
        updatedAt: { toMillis: () => 2000 },
      }),
    });

    const result = await getCurrentProfile();
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.profile.uid).toBe("user123"); // uid from snapshot.id
      expect(result.profile.displayName).toBe("Reign");
      expect(result.profile.bio).toBe("CS student");
      expect(result.profile.createdAt).toBe(1000);
      expect(result.profile.updatedAt).toBe(2000);
    }
  });

  it("returns an error when the Firestore read throws", async () => {
    mocks.authState.currentUser = { uid: "user123" };
    mocks.getDoc.mockRejectedValue(new Error("network fail"));

    const result = await getCurrentProfile();
    expect(result.status).toBe("error");
  });
});

describe("updateCurrentProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authState.currentUser = null;
  });

  it("returns an error when no user is signed in", async () => {
    const result = await updateCurrentProfile({ displayName: "Reign", bio: "hi" });
    expect(result.status).toBe("error");
    expect(mocks.updateDoc).not.toHaveBeenCalled();
  });

  it("writes trimmed fields and a server timestamp on success", async () => {
    mocks.authState.currentUser = { uid: "user123" };
    mocks.updateDoc.mockResolvedValue(undefined);

    const result = await updateCurrentProfile({ displayName: "  Reign  ", bio: "  CS  " });
    expect(result.status).toBe("ok");

    // Confirm it wrote trimmed values + serverTimestamp, and no uid/createdAt.
    const written = mocks.updateDoc.mock.calls[0][1];
    expect(written.displayName).toBe("Reign");
    expect(written.bio).toBe("CS");
    expect(written.updatedAt).toBe("SERVER_TS");
    expect(written).not.toHaveProperty("uid");
    expect(written).not.toHaveProperty("createdAt");
  });

  it("returns an error when the Firestore write throws", async () => {
    mocks.authState.currentUser = { uid: "user123" };
    mocks.updateDoc.mockRejectedValue(new Error("write fail"));

    const result = await updateCurrentProfile({ displayName: "Reign", bio: "hi" });
    expect(result.status).toBe("error");
  });
});