// app/models/feed.ts

/**
 * Shared feed domain model for WeTravel (P3 slice, Sprint 2).
 *
 * Pure domain logic — no Firebase imports on purpose. The UI, the feed
 * service, and the tests all share these types and rules. Timestamps are
 * epoch milliseconds; the service layer converts to/from Firestore's
 * Timestamp at the boundary, so this file never depends on the backend.
 *
 * The feed is newest-first. Pagination is cursor-based on `createdAt`:
 * the service asks Firestore for posts older than the last cursor, and
 * this module owns the pure slicing/normalization logic around it.
 */

export const PAGE_SIZE = 10;

/** A feed post as the app uses it. */
export interface FeedPost {
  id: string;         // Firestore document id
  authorId: string;   // uid of the poster
  content: string;    // trimmed text body
  createdAt: number;  // epoch ms — used for ordering and as the page cursor
  imageUrl?: string;  // optional attached image
}

/** One page of feed results plus the cursor to fetch the next (older) page. */
export interface FeedPage {
  posts: FeedPost[];
  nextCursor: number | null; // createdAt to fetch after; null = no more pages
}

/** Shape of a raw post record before normalization (e.g. from Firestore). */
export interface RawFeedPost {
  id: string;
  authorId: string;
  content?: string | null;
  createdAt: number;
  imageUrl?: string | null;
}

/**
 * Clean a raw post record into a FeedPost. Trims the content and drops an
 * empty imageUrl. Throws if a required field (id, authorId, createdAt) is
 * missing — the service layer treats a throw here as a retrieval failure.
 */
export function normalizePost(raw: RawFeedPost): FeedPost {
  if (!raw || !raw.id || !raw.authorId || typeof raw.createdAt !== "number") {
    throw new Error("Invalid feed post: missing id, authorId, or createdAt");
  }
  const post: FeedPost = {
    id: raw.id,
    authorId: raw.authorId,
    content: (raw.content ?? "").trim(),
    createdAt: raw.createdAt,
  };
  if (raw.imageUrl) {
    post.imageUrl = raw.imageUrl;
  }
  return post;
}

/**
 * Return one page of the feed, newest first, plus the cursor for the next
 * page. Pure function over an in-memory list — the service supplies the
 * candidate posts (already fetched from Firestore) and this slices them.
 *
 * @param allPosts candidate posts (any order)
 * @param cursor   createdAt of the last post seen; null/omitted = first page
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
