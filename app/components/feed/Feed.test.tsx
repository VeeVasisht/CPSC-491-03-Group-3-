// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedPost } from "../../models/feed";

const mocks = vi.hoisted(() => ({
  getFirstFeedPage: vi.fn(),
  getNextFeedPage: vi.fn(),
  getAuthorNames: vi.fn(),
}));

vi.mock("../../services/feedService", () => ({
  getFirstFeedPage: mocks.getFirstFeedPage,
  getNextFeedPage: mocks.getNextFeedPage,
}));

vi.mock("../../services/authorService", () => ({
  getAuthorNames: mocks.getAuthorNames,
  UNKNOWN_AUTHOR: "Unknown traveler",
}));

import { Feed } from "./Feed";

function makePost(i: number, authorId = `user-${i}`): FeedPost {
  return {
    id: `post-${i}`,
    authorId,
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
  beforeEach(() => {
    mocks.getAuthorNames.mockResolvedValue(new Map());
  });

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

  describe("author names", () => {
    /** The "by …" line of the card titled `title`. */
    function bylineOf(title: string): string {
      const card = screen.getByText(title).closest("article") as HTMLElement;
      return card.querySelector("p.text-xs")?.textContent ?? "";
    }

    it("shows each author's displayName on their cards", async () => {
      mocks.getFirstFeedPage.mockResolvedValue({
        posts: [makePost(1, "u-alice"), makePost(2, "u-bob")],
        nextCursor: null,
      });
      mocks.getAuthorNames.mockResolvedValue(new Map([["u-alice", "Alice"], ["u-bob", "Bob"]]));

      render(<Feed />);

      await screen.findByText("Post 1");
      expect(bylineOf("Post 1")).toMatch(/^by Alice/);
      expect(bylineOf("Post 2")).toMatch(/^by Bob/);
    });

    it("shows 'Unknown traveler' when an author has no user doc or displayName", async () => {
      mocks.getFirstFeedPage.mockResolvedValue({
        posts: [makePost(1, "u-alice"), makePost(2, "u-ghost")],
        nextCursor: null,
      });
      mocks.getAuthorNames.mockResolvedValue(new Map([["u-alice", "Alice"]]));

      render(<Feed />);

      await screen.findByText("Post 2");
      expect(bylineOf("Post 1")).toMatch(/^by Alice/);
      expect(bylineOf("Post 2")).toMatch(/^by Unknown traveler/);
      expect(screen.queryByText(/u-ghost/)).toBeNull();
    });

    it("looks up duplicate authors once, in a single batch for the page", async () => {
      mocks.getFirstFeedPage.mockResolvedValue({
        posts: [makePost(1, "u-alice"), makePost(2, "u-bob"), makePost(3, "u-alice"), makePost(4, "u-alice")],
        nextCursor: null,
      });
      mocks.getAuthorNames.mockResolvedValue(new Map([["u-alice", "Alice"], ["u-bob", "Bob"]]));

      render(<Feed />);

      await screen.findByText("Post 4");
      expect(mocks.getAuthorNames).toHaveBeenCalledTimes(1);
      expect(mocks.getAuthorNames).toHaveBeenCalledWith(["u-alice", "u-bob"]);
      expect(bylineOf("Post 3")).toMatch(/^by Alice/);
      expect(bylineOf("Post 4")).toMatch(/^by Alice/);
    });

    it("Load more only looks up authors that weren't on earlier pages", async () => {
      mocks.getFirstFeedPage.mockResolvedValue({
        posts: [makePost(1, "u-alice"), makePost(2, "u-ghost")],
        nextCursor: 998,
      });
      mocks.getNextFeedPage.mockResolvedValue({
        posts: [makePost(3, "u-alice"), makePost(4, "u-ghost"), makePost(5, "u-carol")],
        nextCursor: null,
      });
      mocks.getAuthorNames
        .mockResolvedValueOnce(new Map([["u-alice", "Alice"]]))
        .mockResolvedValueOnce(new Map([["u-carol", "Carol"]]));

      render(<Feed />);
      fireEvent.click(await screen.findByRole("button", { name: "Load more" }));
      await screen.findByText("Post 5");

      expect(mocks.getAuthorNames).toHaveBeenCalledTimes(2);
      expect(mocks.getAuthorNames).toHaveBeenNthCalledWith(1, ["u-alice", "u-ghost"]);
      expect(mocks.getAuthorNames).toHaveBeenNthCalledWith(2, ["u-carol"]);
      expect(bylineOf("Post 3")).toMatch(/^by Alice/);
      expect(bylineOf("Post 4")).toMatch(/^by Unknown traveler/);
      expect(bylineOf("Post 5")).toMatch(/^by Carol/);
    });

    it("still shows the feed with 'Unknown traveler' if the name lookup fails", async () => {
      mocks.getFirstFeedPage.mockResolvedValue({ posts: [makePost(1, "u-alice")], nextCursor: null });
      mocks.getAuthorNames.mockRejectedValue(new Error("permission-denied"));

      render(<Feed />);

      await screen.findByText("Post 1");
      expect(bylineOf("Post 1")).toMatch(/^by Unknown traveler/);
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });
});
