import {
  collection,
  getDocsFromServer,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import { normalizePost, type FeedPost } from "../models/feed";

/**
 * All posts written by one user, newest first, for the profile page grid.
 *
 * Filters on authorId only and sorts in the app, so Firestore doesn't need a
 * composite (authorId + createdAt) index. Fine at our data size.
 *
 * Uses getDocsFromServer for the same reason as feedService: getDocs quietly
 * falls back to the offline cache and would hide load errors.
 */
export async function getPostsByAuthor(uid: string): Promise<FeedPost[]> {
  const postsQuery = query(
    collection(db, "posts"),
    where("authorId", "==", uid),
  );
  const snapshot = await getDocsFromServer(postsQuery);

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

  return posts.sort((a, b) => b.createdAt - a.createdAt);
}
