import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  runTransaction: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  db: { name: "mock-db" },
}));

vi.mock("firebase/firestore", () => ({
  doc: mocks.doc,
  getDoc: mocks.getDoc,
  runTransaction: mocks.runTransaction,
  collection: mocks.collection,
  getDocs: mocks.getDocs,
  addDoc: mocks.addDoc,
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(),
}));

vi.mock("../firebase/firebase", () => ({ db: mocks.db }));

import { addComment, getLikeState } from "./socialService";

describe("socialService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default like state when IDs are missing", async () => {
    const res = await getLikeState("", "");
    expect(res).toEqual({ isLiked: false, likeCount: 0 });
  });

  it("throws when adding an empty comment", async () => {
    await expect(
      addComment({
        postId: "post-1",
        userId: "user-1",
        authorName: "Alex",
        content: "   ",
      }),
    ).rejects.toThrow("Comment cannot be empty.");
  });
});