// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FeedPost } from "../../models/feed";

const mocks = vi.hoisted(() => ({
  getFirstFeedPage: vi.fn(),
  getNextFeedPage: vi.fn(),
}));

vi.mock("../../services/feedService", () => ({
  getFirstFeedPage: mocks.getFirstFeedPage,
  getNextFeedPage: mocks.getNextFeedPage,
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
    vi.resetAllMocks();
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

  it("shows a loading message on first load, then removes it", async () => {
    mocks.getFirstFeedPage.mockResolvedValue({ posts: [makePost(1)], nextCursor: null });

    render(<Feed />);

    expect(screen.getByText("Loading posts...")).toBeTruthy();
    expect(await screen.findByText("Post 1")).toBeTruthy();
    expect(screen.queryByText("Loading posts...")).toBeNull();
  });

  it("shows an error with Retry, and Retry recovers", async () => {
    mocks.getFirstFeedPage
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ posts: [makePost(1)], nextCursor: null });

    render(<Feed />);

    expect(await screen.findByText(/Couldn't load the feed/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Post 1")).toBeTruthy();
    expect(screen.queryByText(/Couldn't load the feed/)).toBeNull();
    expect(mocks.getFirstFeedPage).toHaveBeenCalledTimes(2);
  });

  it("shows an empty message when there are no posts", async () => {
    mocks.getFirstFeedPage.mockResolvedValue({ posts: [], nextCursor: null });

    render(<Feed />);

    expect(await screen.findByText(/No posts yet/)).toBeTruthy();
    expect(screen.queryByRole("article")).toBeNull();
  });
});
