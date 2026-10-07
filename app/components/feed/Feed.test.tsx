// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FeedPost } from "../../models/feed";

const mocks = vi.hoisted(() => ({
  getFirstFeedPage: vi.fn(),
}));

vi.mock("../../services/feedService", () => ({
  getFirstFeedPage: mocks.getFirstFeedPage,
}));

import { Feed } from "./Feed";

function makePost(i: number): FeedPost {
  return {
    id: `post-${i}`,
    authorId: `user-${i}`,
    title: `Post ${i}`,
    description: `Description ${i}`,
    imageUrl: "",
    createdAt: 1000 - i,
    updatedAt: 1000 - i,
    location: null,
  };
}

describe("Feed", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders one PostCard per post from the first feed page", async () => {
    const posts = [makePost(1), makePost(2), makePost(3)];
    mocks.getFirstFeedPage.mockResolvedValue({ posts, nextCursor: null });

    render(<Feed />);

    expect(await screen.findByText("Post 1")).toBeTruthy();
    expect(screen.getByText("Post 2")).toBeTruthy();
    expect(screen.getByText("Post 3")).toBeTruthy();
    expect(screen.getAllByRole("article")).toHaveLength(posts.length);
    expect(mocks.getFirstFeedPage).toHaveBeenCalledTimes(1);
  });
});
