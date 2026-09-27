// app/models/feed.ts

/**
 * Feed Retrieval & Pagination domain model for WeTravel (P3 slice, Sprint 2).
 *
 * The canonical post shape is `Post` in ./post (owned by the posts feature).
 * FeedPost mirrors those fields but stores `createdAt`/`updatedAt` as epoch
 * milliseconds instead of Firestore `Timestamp`s, so the pagination logic
 * stays pure and unit-testable with no Firebase dependency. The service layer
 * converts Firestore `Timestamp` -> ms at the boundary before calling in here.
 *
 * TODO (once #16 merges and app/models/post.ts is on main): import Post as the
 * single source of truth and add a toFeedPost(post: Post) boundary mapper.
 */

export const PAGE_SIZE = 10;

/** Pagination view of a Post — same fields, timestamps as epoch ms. */
export interface FeedPost {
  id: string;
  authorId: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: number; // epoch ms — ordering + page cursor
  updatedAt: number; // epoch ms
}

/** One page of feed results plus the cursor for the next (older) page. */
export interface FeedPage {
  posts: FeedPost[];
  nextCursor: number | null; // createdAt to fetch after; null = no more pages
}

/** Raw record before normalization (from Firestore; timestamps already ms). */
export interface RawFeedPost {
  id: string;
  authorId: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  createdAt: number;
  updatedAt?: number | null;
}

/**
 * Clean a raw record into a FeedPost. Trims text fields; throws if a required
 * field (id, authorId, createdAt) is missing — the service treats a throw as a
 * retrieval failure.
 */
export function normalizePost(raw: RawFeedPost): FeedPost {
  if (!raw || !raw.id || !raw.authorId || typeof raw.createdAt !== "number") {
    throw new Error("Invalid feed post: missing id, authorId, or createdAt");
  }
  return {
    id: raw.id,
    authorId: raw.authorId,
    title: (raw.title ?? "").trim(),
    description: (raw.description ?? "").trim(),
    imageUrl: (raw.imageUrl ?? "").trim(),
    createdAt: raw.createdAt,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : raw.createdAt,
  };
}

/**
 * Return one page of the feed, newest first, plus the next-page cursor.
 * Pure function over an in-memory list.
 */
export function paginateFeed(
  allPosts: FeedPost[],
  cursor: number | null = null,
): FeedPage {
  const newestFirst = [...allPosts].sort((a, b) => b.createdAt - a.createdAt);
  const remaining =
    cursor === null
      ? newestFirst
      : newestFirst.filter((p) => p.createdAt < cursor);

  const posts = remaining.slice(0, PAGE_SIZE);
  const hasMore = remaining.length > PAGE_SIZE;
  const nextCursor = hasMore ? posts[posts.length - 1].createdAt : null;

  return { posts, nextCursor };
}

/** True when a page is the last one (no more posts to load). */
export function isLastPage(page: FeedPage): boolean {
  return page.nextCursor === null;
}
