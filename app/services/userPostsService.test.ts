import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  collection: vi.fn(),
  getDocsFromServer: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  db: { name: "mock-db" },
}));

vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  getDocsFromServer: mocks.getDocsFromServer,
  query: mocks.query,
  where: mocks.where,
}));

vi.mock("../firebase/firebase", () => ({ db: mocks.db }));

import { getPostsByAuthor } from "./userPostsService";

function fakeDoc(id: string, createdAt: number, authorId = "user-1") {
  return {
    id,
    data: () => ({
      authorId,
      title: ` Post ${id} `,
      description: "desc",
      imageUrl: "https://example.com/a.jpg",
      createdAt: { toMillis: () => createdAt },
    }),
  };
}

describe("getPostsByAuthor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.collection.mockReturnValue("posts-ref");
    mocks.where.mockReturnValue("where-clause");
    mocks.query.mockReturnValue("the-query");
  });

  it("queries posts where authorId equals the given uid", async () => {
    mocks.getDocsFromServer.mockResolvedValue({ docs: [] });

    await getPostsByAuthor("user-1");

    expect(mocks.collection).toHaveBeenCalledWith(mocks.db, "posts");
    expect(mocks.where).toHaveBeenCalledWith("authorId", "==", "user-1");
    expect(mocks.query).toHaveBeenCalledWith("posts-ref", "where-clause");
    expect(mocks.getDocsFromServer).toHaveBeenCalledWith("the-query");
  });

  it("returns posts newest first and normalized", async () => {
    mocks.getDocsFromServer.mockResolvedValue({
      docs: [fakeDoc("old", 1000), fakeDoc("new", 3000), fakeDoc("mid", 2000)],
    });

    const posts = await getPostsByAuthor("user-1");

    expect(posts.map((p) => p.id)).toEqual(["new", "mid", "old"]);
    expect(posts[0].title).toBe("Post new");
  });

  it("returns an empty list when the user has no posts", async () => {
    mocks.getDocsFromServer.mockResolvedValue({ docs: [] });
    await expect(getPostsByAuthor("user-1")).resolves.toEqual([]);
  });

  it("rejects when Firestore can't be reached", async () => {
    mocks.getDocsFromServer.mockRejectedValue(new Error("offline"));
    await expect(getPostsByAuthor("user-1")).rejects.toThrow("offline");
  });
});
