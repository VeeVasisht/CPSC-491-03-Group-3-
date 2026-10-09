import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  fromMillis: vi.fn(),
  db: { name: "mock-db" },
}));

vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  getDocs: mocks.getDocs,
  query: mocks.query,
  orderBy: mocks.orderBy,
  limit: mocks.limit,
  startAfter: mocks.startAfter,
  Timestamp: { fromMillis: mocks.fromMillis },
}));

vi.mock("../firebase/firebase", () => ({ db: mocks.db }));

import { getFirstFeedPage, getNextFeedPage } from "./feedService";
import { PAGE_SIZE } from "../models/feed";
import type { Geotag } from "../models/geotag";

interface FakePost {
  id: string;
  authorId: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: number;
  updatedAt?: number;
  location?: Geotag | null;
}

function fakeSnapshot(posts: FakePost[]) {
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
        ...(p.location !== undefined && { location: p.location }),
      }),
    })),
  };
}

function makeRawPosts(count: number): FakePost[] {
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
    mocks.startAfter.mockReturnValue({});
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
    expect(mocks.startAfter).not.toHaveBeenCalled();
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

  it("carries a post's location through to the feed", async () => {
    const location = { name: "Kyoto", latitude: 35.0116, longitude: 135.7681 };
    mocks.getDocs.mockResolvedValue(
      fakeSnapshot([{ ...makeRawPosts(1)[0], location }]),
    );
    const page = await getFirstFeedPage();
    expect(page.posts[0].location).toEqual(location);
  });

  it("sets location to null for posts without one", async () => {
    mocks.getDocs.mockResolvedValue(fakeSnapshot(makeRawPosts(1)));
    const page = await getFirstFeedPage();
    expect(page.posts[0].location).toBeNull();
  });
});

describe("getNextFeedPage", () => {
  const CURSOR = 5000;

  /** `count` posts all older than CURSOR, newest first. */
  function makeOlderPosts(count: number): FakePost[] {
    return makeRawPosts(count).map((p, i) => ({ ...p, createdAt: CURSOR - 1 - i }));
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.collection.mockReturnValue({});
    mocks.query.mockReturnValue({});
    mocks.orderBy.mockReturnValue({});
    mocks.limit.mockReturnValue({});
    mocks.startAfter.mockReturnValue({});
    mocks.fromMillis.mockImplementation((ms: number) => ({ ms }));
  });

  it("starts the query after the cursor's createdAt Timestamp", async () => {
    mocks.getDocs.mockResolvedValue(fakeSnapshot(makeOlderPosts(2)));
    await getNextFeedPage(CURSOR);
    expect(mocks.collection).toHaveBeenCalledWith(mocks.db, "posts");
    expect(mocks.orderBy).toHaveBeenCalledWith("createdAt", "desc");
    expect(mocks.fromMillis).toHaveBeenCalledWith(CURSOR);
    expect(mocks.startAfter).toHaveBeenCalledWith({ ms: CURSOR });
    expect(mocks.limit).toHaveBeenCalledWith(PAGE_SIZE + 1);
  });

  it("returns older posts newest-first with no cursor when they fit one page", async () => {
    mocks.getDocs.mockResolvedValue(fakeSnapshot(makeOlderPosts(4)));
    const page = await getNextFeedPage(CURSOR);
    expect(page.posts).toHaveLength(4);
    for (const post of page.posts) {
      expect(post.createdAt).toBeLessThan(CURSOR);
    }
    for (let i = 1; i < page.posts.length; i++) {
      expect(page.posts[i].createdAt).toBeLessThan(page.posts[i - 1].createdAt);
    }
    expect(page.nextCursor).toBeNull();
  });

  it("caps at PAGE_SIZE and sets a nextCursor when more exist", async () => {
    mocks.getDocs.mockResolvedValue(fakeSnapshot(makeOlderPosts(PAGE_SIZE + 1)));
    const page = await getNextFeedPage(CURSOR);
    expect(page.posts).toHaveLength(PAGE_SIZE);
    expect(page.nextCursor).toBe(page.posts[PAGE_SIZE - 1].createdAt);
  });

  it("returns an empty last page when nothing is older than the cursor", async () => {
    mocks.getDocs.mockResolvedValue(fakeSnapshot([]));
    const page = await getNextFeedPage(CURSOR);
    expect(page.posts).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });

  it("rejects when Firestore fails", async () => {
    mocks.getDocs.mockRejectedValue(new Error("unavailable"));
    await expect(getNextFeedPage(CURSOR)).rejects.toThrow("unavailable");
  });
});
