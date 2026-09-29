import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

import { db } from "../firebase/firebase";
import {
  normalizePost,
  paginateFeed,
  PAGE_SIZE,
  type FeedPage,
} from "../models/feed";

/**
 * Fetch the first page of the feed — newest posts first.
 *
 * Queries the `posts` collection ordered by `createdAt` descending, pulling one
 * extra doc (PAGE_SIZE + 1) so paginateFeed can tell whether a next page exists.
 * Firestore `Timestamp`s are converted to epoch ms at this boundary, then the
 * pure model logic handles slicing and the next-page cursor.
 */
export async function getFirstFeedPage(): Promise<FeedPage> {
  const postsRef = collection(db, "posts");
  const q = query(postsRef, orderBy("createdAt", "desc"), limit(PAGE_SIZE + 1));
  const snapshot = await getDocs(q);

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
    });
  });

  return paginateFeed(posts);
}