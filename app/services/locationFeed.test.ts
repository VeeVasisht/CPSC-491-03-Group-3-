// @vitest-environment node
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

vi.mock("../firebase/firebase", () => ({
  db: mocks.db,
}));

import { getLocationFeed } from "./locationFeedService";

describe("Location Feed Unit/Service Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries and filters posts by region name from mocked Firestore", async () => {
    // Mock the Firestore query and snapshot return
    mocks.getDocsFromServer.mockResolvedValueOnce({
      docs: [
        {
          id: "test-post-1",
          data: () => ({
            authorId: "user-1",
            title: "Irvine Park Visit",
            description: "Great sunny day in Irvine.",
            imageUrl: "https://example.com/img.png",
            location: {
              name: "Irvine, CA",
              latitude: 33.6846,
              longitude: -117.8265,
            },
            createdAt: { toMillis: () => Date.now() },
          }),
        },
      ],
    });

    const feed = await getLocationFeed({ regionName: "Irvine" });
    expect(feed.length).toBeGreaterThan(0);
    expect(feed.some((p) => p.id === "test-post-1")).toBe(true);
  });

  it("returns empty result when no posts match region", async () => {
    mocks.getDocsFromServer.mockResolvedValueOnce({
      docs: [],
    });

    const feed = await getLocationFeed({ regionName: "NonExistentRegion999" });
    expect(feed).toEqual([]);
  });
});