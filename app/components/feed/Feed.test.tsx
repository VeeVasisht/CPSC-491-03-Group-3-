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

/** True when `a` comes before `b` in document order. */
function isBefore(a: Element, b: Element): boolean {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
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

  it("Load more fetches the next page with the cursor and appends posts", async () => {
    mocks.getFirstFeedPage.mockResolvedValue({ posts: [makePost(1), makePost(2)], nextCursor: 998 });
    mocks.getNextFeedPage.mockResolvedValue({ posts: [makePost(3), makePost(4)], nextCursor: 996 });

    render(<Feed />);

    fireEvent.click(await screen.findByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Post 4")).toBeTruthy();
    expect(mocks.getNextFeedPage).toHaveBeenCalledWith(998);
    expect(screen.getAllByRole("article").map((a) => a.querySelector("h2")?.textContent)).toEqual([
      "Post 1",
      "Post 2",
      "Post 3",
      "Post 4",
    ]);
  });

  it("shows the end-of-feed message instead of Load more on the last page", async () => {
    mocks.getFirstFeedPage.mockResolvedValue({ posts: [makePost(1)], nextCursor: 999 });
    mocks.getNextFeedPage.mockResolvedValue({ posts: [makePost(2)], nextCursor: null });

    render(<Feed />);

    fireEvent.click(await screen.findByRole("button", { name: "Load more" }));

    expect(await screen.findByText("You're all caught up")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("shows the end-of-feed message when the first page is the last", async () => {
    mocks.getFirstFeedPage.mockResolvedValue({ posts: [makePost(1)], nextCursor: null });

    render(<Feed />);

    expect(await screen.findByText("You're all caught up")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("shows the Load more error below the posts without wiping them", async () => {
    mocks.getFirstFeedPage.mockResolvedValue({ posts: [makePost(1), makePost(2)], nextCursor: 998 });
    mocks.getNextFeedPage.mockRejectedValue(new Error("offline"));

    render(<Feed />);

    fireEvent.click(await screen.findByRole("button", { name: "Load more" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/Couldn't load more posts/);
    expect(screen.getByText("Post 1")).toBeTruthy();
    expect(screen.getByText("Post 2")).toBeTruthy();
    const articles = screen.getAllByRole("article");
    expect(isBefore(articles[articles.length - 1], alert)).toBe(true);
    await waitFor(() => {
      expect(
        (screen.getByRole("button", { name: "Load more" }) as HTMLButtonElement).disabled,
      ).toBe(false);
    });
  });

  it("Refresh keeps existing posts visible while it loads, then shows the new page", async () => {
    let resolveRefresh!: (page: { posts: FeedPost[]; nextCursor: number | null }) => void;
    mocks.getFirstFeedPage
      .mockResolvedValueOnce({ posts: [makePost(1)], nextCursor: null })
      .mockReturnValueOnce(new Promise((resolve) => {
        resolveRefresh = resolve;
      }));

    render(<Feed />);

    fireEvent.click(await screen.findByRole("button", { name: "Refresh" }));

    expect(await screen.findByText("Refreshing...")).toBeTruthy();
    expect(screen.getByText("Post 1")).toBeTruthy();
    expect(screen.queryByText("Loading posts...")).toBeNull();

    resolveRefresh({ posts: [makePost(0), makePost(1)], nextCursor: null });

    expect(await screen.findByText("Post 0")).toBeTruthy();
    expect(screen.queryByText("Refreshing...")).toBeNull();
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("shows the Refresh error above the posts without wiping them", async () => {
    mocks.getFirstFeedPage
      .mockResolvedValueOnce({ posts: [makePost(1)], nextCursor: null })
      .mockRejectedValueOnce(new Error("offline"));

    render(<Feed />);

    fireEvent.click(await screen.findByRole("button", { name: "Refresh" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/Couldn't refresh the feed/);
    expect(screen.getByText("Post 1")).toBeTruthy();
    expect(isBefore(alert, screen.getAllByRole("article")[0])).toBe(true);
    expect(isBefore(screen.getByRole("button", { name: "Refresh" }), alert)).toBe(true);
  });
});
