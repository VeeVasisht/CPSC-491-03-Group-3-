// app/models/feed.test.ts

import { describe, it, expect } from "vitest";
import {
  paginateFeed,
  normalizePost,
  isLastPage,
  PAGE_SIZE,
  type FeedPost,
} from "./feed";

/** Build `count` posts with descending, unique createdAt timestamps. */
function makePosts(count: number): FeedPost[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `post-${i}`,
    authorId: `user-${i % 3}`,
    title: `Post ${i}`,
    description: `Description ${i}`,
    imageUrl: `https://img/${i}.png`,
    createdAt: 1_000 + (count - i),
    updatedAt: 1_000 + (count - i),
  }));
}

describe("paginateFeed", () => {
  it("returns the first page newest-first when given no cursor", () => {
    const page = paginateFeed(makePosts(25));
    expect(page.posts).toHaveLength(PAGE_SIZE);
    for (let i = 1; i < page.posts.length; i++) {
      expect(page.posts[i].createdAt).toBeLessThan(page.posts[i - 1].createdAt);
    }
  });

  it("advances to the next page using the cursor from the previous page", () => {
    const posts = makePosts(25);
    const first = paginateFeed(posts);
    const second = paginateFeed(posts, first.nextCursor);
    expect(second.posts).toHaveLength(PAGE_SIZE);
    const firstIds = new Set(first.posts.map((p) => p.id));
    for (const p of second.posts) {
      expect(firstIds.has(p.id)).toBe(false);
      expect(p.createdAt).toBeLessThan(first.nextCursor!);
    }
  });

  it("does not return the same page again when paginating", () => {
    const posts = makePosts(25);
    const first = paginateFeed(posts);
    const second = paginateFeed(posts, first.nextCursor);
    expect(second.posts[0].id).not.toBe(first.posts[0].id);
  });

  it("handles an empty feed", () => {
    const page = paginateFeed([]);
    expect(page.posts).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });

  it("marks the last page with a null cursor and does not over-read", () => {
    const posts = makePosts(15);
    const first = paginateFeed(posts);
    expect(first.nextCursor).not.toBeNull();
    const second = paginateFeed(posts, first.nextCursor);
    expect(second.posts).toHaveLength(5);
    expect(second.nextCursor).toBeNull();
    expect(isLastPage(second)).toBe(true);
  });

  it("treats an exactly-full single page as the last page", () => {
    const page = paginateFeed(makePosts(PAGE_SIZE));
    expect(page.posts).toHaveLength(PAGE_SIZE);
    expect(page.nextCursor).toBeNull();
    expect(isLastPage(page)).toBe(true);
  });

  it("sorts unsorted input newest-first before paging", () => {
    const posts = makePosts(5).sort(() => Math.random() - 0.5);
    const page = paginateFeed(posts);
    for (let i = 1; i < page.posts.length; i++) {
      expect(page.posts[i].createdAt).toBeLessThan(page.posts[i - 1].createdAt);
    }
  });
});

describe("normalizePost", () => {
  it("trims title and description and keeps required fields", () => {
    const post = normalizePost({
      id: "a1",
      authorId: "user-1",
      title: "  Hello  ",
      description: "  world  ",
      imageUrl: "http://x/y.png",
      createdAt: 1234,
    });
    expect(post).toEqual({
      id: "a1",
      authorId: "user-1",
      title: "Hello",
      description: "world",
      imageUrl: "http://x/y.png",
      createdAt: 1234,
      updatedAt: 1234,
    });
  });

  it("defaults missing title/description to empty strings", () => {
    const post = normalizePost({
      id: "a1",
      authorId: "user-1",
      createdAt: 1234,
      title: null,
      description: null,
    });
    expect(post.title).toBe("");
    expect(post.description).toBe("");
  });

  it("defaults updatedAt to createdAt when missing", () => {
    const post = normalizePost({ id: "a1", authorId: "u", createdAt: 1234 });
    expect(post.updatedAt).toBe(1234);
  });

  it("throws when a required field is missing (retrieval failure)", () => {
    expect(() => normalizePost({ id: "", authorId: "u", createdAt: 1 })).toThrow();
    // @ts-expect-error deliberately missing createdAt to test the guard
    expect(() => normalizePost({ id: "a", authorId: "u" })).toThrow();
  });
});
