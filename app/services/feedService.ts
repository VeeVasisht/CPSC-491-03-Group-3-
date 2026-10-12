import {
  collection,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  type QueryConstraint,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import {
  normalizePost,
  paginateFeed,
  PAGE_SIZE,
  type FeedPage,
} from "../models/feed";

/**
 * Fetch one page of the feed, newest first, starting after `cursor` (a
 * `createdAt` in epoch ms) or from the top when `cursor` is null.
 *
 * Queries the `posts` collection ordered by `createdAt` descending, pulling one
 * extra doc (PAGE_SIZE + 1) so paginateFeed can tell whether a next page exists.
 * Firestore `Timestamp`s are converted to epoch ms at this boundary, then the
 * pure model logic handles slicing and the next-page cursor.
 *
 * Uses getDocsFromServer, not getDocs: when the server is unreachable getDocs
 * silently resolves from the local cache, which hides offline errors from the
 * feed (Refresh/Load more appear to succeed). This rejects instead.
 */
async function fetchFeedPage(cursor: number | null): Promise<FeedPage> {
  const postsRef = collection(db, "posts");
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (cursor !== null) {
    constraints.push(startAfter(Timestamp.fromMillis(cursor)));
  }
  constraints.push(limit(PAGE_SIZE + 1));

  const snapshot = await getDocsFromServer(query(postsRef, ...constraints));

  const posts = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return normalizePost({
      id: docSnap.id,
      authorId: data.authorId,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
      updatedAt: data.updatedAt?.toMillis?.() ?? undefined,
      location: data.location,
    });
  });

  return paginateFeed(posts, cursor);
}

/** Fetch the first page of the feed — newest posts first. */
export async function getFirstFeedPage(): Promise<FeedPage> {
  return fetchFeedPage(null);
}

/**
 * Fetch the page after `cursor`, the `nextCursor` (createdAt, epoch ms) from
 * the previous page.
 */
export async function getNextFeedPage(cursor: number): Promise<FeedPage> {
  return fetchFeedPage(cursor);
}
