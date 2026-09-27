import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(),

  db: {
    name: "mock-db",
  },
}));

vi.mock("firebase/firestore", () => ({
  doc: mocks.doc,
  setDoc: mocks.setDoc,
  deleteDoc: mocks.deleteDoc,
  getDoc: mocks.getDoc,
  serverTimestamp:
    mocks.serverTimestamp,
}));

vi.mock("../firebase/firebase", () => ({
  db: mocks.db,
}));

import {
  isPostSaved,
  savePost,
  unsavePost,
} from "./savedPostService";

describe("savedPostService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.doc.mockReturnValue({
      path: "mock-reference",
    });

    mocks.serverTimestamp.mockReturnValue(
      "mock-timestamp",
    );
  });

  it("saves a post for a user", async () => {
    mocks.setDoc.mockResolvedValue(undefined);

    await savePost(
      "user-123",
      "post-456",
    );

    expect(mocks.doc).toHaveBeenCalledWith(
      mocks.db,
      "users",
      "user-123",
      "savedPosts",
      "post-456",
    );

    expect(mocks.setDoc).toHaveBeenCalledWith(
      {
        path: "mock-reference",
      },
      {
        postId: "post-456",
        savedAt: "mock-timestamp",
      },
    );
  });

  it("unsaves a post", async () => {
    mocks.deleteDoc.mockResolvedValue(
      undefined,
    );

    await unsavePost(
      "user-123",
      "post-456",
    );

    expect(
      mocks.deleteDoc,
    ).toHaveBeenCalledTimes(1);
  });

  it("returns true when a post is saved", async () => {
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
    });

    await expect(
      isPostSaved(
        "user-123",
        "post-456",
      ),
    ).resolves.toBe(true);
  });

  it("returns false when a post is not saved", async () => {
    mocks.getDoc.mockResolvedValue({
      exists: () => false,
    });

    await expect(
      isPostSaved(
        "user-123",
        "post-456",
      ),
    ).resolves.toBe(false);
  });

  it("rejects an empty user id", async () => {
    await expect(
      savePost("", "post-456"),
    ).rejects.toThrow(
      "User ID is required.",
    );
  });

  it("rejects an empty post id", async () => {
    await expect(
      savePost("user-123", ""),
    ).rejects.toThrow(
      "Post ID is required.",
    );
  });

  it("returns false when ids are missing", async () => {
    await expect(
      isPostSaved("", ""),
    ).resolves.toBe(false);
  });
});
