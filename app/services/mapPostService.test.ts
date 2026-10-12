import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  collection: vi.fn(), doc: vi.fn(), getDocFromServer: vi.fn(),
  getDocsFromServer: vi.fn(), limit: vi.fn(), orderBy: vi.fn(), query: vi.fn(),
}));

vi.mock("firebase/firestore", () => mocks);
vi.mock("../firebase/firebase", () => ({ db: { project: "test-project" } }));

import { getMapPostById, getMapPosts } from "./mapPostService";

const sample = (overrides: Record<string, unknown> = {}) => ({
  authorId: "test-author", title: "Kyoto", description: "Beautiful city",
  imageUrl: "https://example.com/pic.jpg",
  createdAt: { toMillis: () => 1000 },
  updatedAt: { toMillis: () => 1000 },
  location: { name: "Kyoto", latitude: 35.0116, longitude: 135.7681 },
  ...overrides,
});
const docSnap = (id: string, value: Record<string, unknown>) => ({ id, data: () => value });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.collection.mockReturnValue("posts-ref");
  mocks.query.mockReturnValue("posts-query");
});

describe("Sprint 3 map Firestore integration", () => {
  it("requests recent posts separately from the 10-post feed page", async () => {
    mocks.getDocsFromServer.mockResolvedValue({ docs: [docSnap("post-1", sample())] });
    const posts = await getMapPosts();
    expect(mocks.collection).toHaveBeenCalledWith(expect.anything(), "posts");
    expect(mocks.orderBy).toHaveBeenCalledWith("createdAt", "desc");
    expect(mocks.limit).toHaveBeenCalledWith(200);
    expect(posts[0].location?.name).toBe("Kyoto");
    expect(posts[0].id).toBe("post-1");
  });

  it("ignores malformed records, safely dropping invalid location coordinates", async () => {
    mocks.getDocsFromServer.mockResolvedValue({ docs: [
      docSnap("good", sample()),
      docSnap("bad-coordinates", sample({ location: { name: "Bad", latitude: 91, longitude: 1 } })),
      docSnap("bad-created-at", sample({ createdAt: null })),
      docSnap("bad-author", sample({ authorId: "" })),
    ] });
    const posts = await getMapPosts();
    expect(posts).toHaveLength(2);
    expect(posts[0].location?.latitude).toBe(35.0116);
    expect(posts[1].location).toBeNull();
  });

  it("gets the selected post by ID instead of looking only in first feed page", async () => {
    mocks.getDocFromServer.mockResolvedValue({ ...docSnap("selected", sample()), exists: () => true });
    const post = await getMapPostById("selected");
    expect(post?.id).toBe("selected");
    expect(mocks.doc).toHaveBeenCalledWith(expect.anything(), "posts", "selected");
  });

  it("handles absent or invalid post IDs without displaying a wrong post", async () => {
    expect(await getMapPostById("../other")).toBeNull();
    expect(mocks.getDocFromServer).not.toHaveBeenCalled();
    mocks.getDocFromServer.mockResolvedValue({ exists: () => false });
    expect(await getMapPostById("missing")).toBeNull();
  });
});
