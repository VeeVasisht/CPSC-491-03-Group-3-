import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  db: { name: "mock-db" },
}));

vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  getDocs: mocks.getDocs,
  query: mocks.query,
  orderBy: mocks.orderBy,
  limit: mocks.limit,
}));

vi.mock("../firebase/firebase", () => ({ db: mocks.db }));

import { getFirstFeedPage } from "./feedService";
import { PAGE_SIZE } from "../models/feed";

function fakeSnapshot(posts) {
  return {
    docs: posts.map((p) => ({
      id: p.id,
      data: () => ({
        authorId: p.authorId,
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl,
        createdAt: { toMillis: () => p.createdAt },
        updatedAt: { toMillis: () => p.updatedAt ?? p.createdAt },
      }),
    })),
  };
}

function makeRawPosts(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `post-${i}`,
    authorId: `user-${i}`,
    title: `Title ${i}`,
    description: `Desc ${i}`,
    imageUrl: `https://img/${i}.png`,
    createdAt: 1000 + (count - i),
  }));
}

describe("getFirstFeedPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.collection.mockReturnValue({});
    mocks.query.mockReturnValue({});
    mocks.orderBy.mockReturnValue({});
    mocks.limit.mockReturnValue({});
  });

  it("returns posts newest-first with no cursor when they fit one page", async () => {
    mocks.getDocs.mockResolvedValue(fakeSnapshot(makeRawPosts(5)));
    const page = await getFirstFeedPage();
    expect(page.posts).toHaveLength(5);
    for (let i = 1; i < page.posts.length; i++) {
      expect(page.posts[i].createdAt).toBeLessThan(page.posts[i - 1].createdAt);
    }
    expect(page.nextCursor).toBeNull();
  });

  it("caps at PAGE_SIZE and sets a nextCursor when more exist", async () => {
    mocks.getDocs.mockResolvedValue(fakeSnapshot(makeRawPosts(PAGE_SIZE + 1)));
    const page = await getFirstFeedPage();
    expect(page.posts).toHaveLength(PAGE_SIZE);
    expect(page.nextCursor).not.toBeNull();
  });

  it("queries the posts collection ordered by createdAt desc", async () => {
    mocks.getDocs.mockResolvedValue(fakeSnapshot(makeRawPosts(2)));
    await getFirstFeedPage();
    expect(mocks.collection).toHaveBeenCalledWith(mocks.db, "posts");
    expect(mocks.orderBy).toHaveBeenCalledWith("createdAt", "desc");
  });

  it("returns an empty page when there are no posts", async () => {
    mocks.getDocs.mockResolvedValue(fakeSnapshot([]));
    const page = await getFirstFeedPage();
    expect(page.posts).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });

  it("converts Firestore Timestamps to epoch ms", async () => {
    mocks.getDocs.mockResolvedValue(
      fakeSnapshot([
        {
          id: "p1",
          authorId: "u1",
          title: "T",
          description: "D",
          imageUrl: "http://x",
          createdAt: 5000,
          updatedAt: 6000,
        },
      ]),
    );
    const page = await getFirstFeedPage();
    expect(page.posts[0].createdAt).toBe(5000);
    expect(page.posts[0].updatedAt).toBe(6000);
  });
});