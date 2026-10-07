import type { Geotag } from "./geotag";

export const PAGE_SIZE = 10;

/**
 * Feed representation of a travel post.
 *
 * Firestore timestamps are converted to epoch milliseconds so the
 * feed pagination logic stays independent from Firebase.
 *
 * The optional location field reuses the shared Geotag model so
 * geotagged posts can be opened on the map.
 */
export interface FeedPost {
  id: string;
  authorId: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: number;
  updatedAt: number;
  location?: Geotag | null;
}

export interface FeedPage {
  posts: FeedPost[];
  nextCursor: number | null;
}

export interface RawFeedPost {
  id: string;
  authorId: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  createdAt: number;
  updatedAt?: number | null;
  location?: Geotag | null;
}

export function normalizePost(
  raw: RawFeedPost,
): FeedPost {
  if (
    !raw ||
    !raw.id ||
    !raw.authorId ||
    typeof raw.createdAt !== "number"
  ) {
    throw new Error(
      "Invalid feed post: missing id, authorId, or createdAt",
    );
  }

  return {
    id: raw.id,
    authorId: raw.authorId,
    title: (raw.title ?? "").trim(),
    description: (raw.description ?? "").trim(),
    imageUrl: (raw.imageUrl ?? "").trim(),
    createdAt: raw.createdAt,
    updatedAt:
      typeof raw.updatedAt === "number"
        ? raw.updatedAt
        : raw.createdAt,
    location: raw.location ?? null,
  };
}

export function paginateFeed(
  allPosts: FeedPost[],
  cursor: number | null = null,
): FeedPage {
  const newestFirst = [...allPosts].sort(
    (a, b) => b.createdAt - a.createdAt,
  );

  const remaining =
    cursor === null
      ? newestFirst
      : newestFirst.filter(
          (post) => post.createdAt < cursor,
        );

  const posts = remaining.slice(0, PAGE_SIZE);

  const hasMore = remaining.length > PAGE_SIZE;

  const nextCursor = hasMore
    ? posts[posts.length - 1].createdAt
    : null;

  return {
    posts,
    nextCursor,
  };
}

export function isLastPage(
  page: FeedPage,
): boolean {
  return page.nextCursor === null;
}
