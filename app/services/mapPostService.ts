import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  type DocumentData,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import { normalizePost, type FeedPost } from "../models/feed";

// Bound the initial map read. A future geospatial query/index can replace this
// without changing the Map component or its marker contracts.
const MAP_POST_READ_LIMIT = 200;

function normalizeFirestorePost(id: string, data: DocumentData): FeedPost | null {
  const createdAt = data.createdAt?.toMillis?.();
  if (!Number.isFinite(createdAt)) return null;

  try {
    return normalizePost({
      id,
      authorId: data.authorId,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      createdAt,
      updatedAt: data.updatedAt?.toMillis?.(),
      location: data.location,
    });
  } catch {
    // Skip records with malformed required fields instead of breaking the map.
    return null;
  }
}

/** Load up to 200 recent posts; map conversion filters non-geotagged posts. */
export async function getMapPosts(): Promise<FeedPost[]> {
  const snapshot = await getDocsFromServer(
    query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(MAP_POST_READ_LIMIT)),
  );
  return snapshot.docs.flatMap((postDoc) => {
    const post = normalizeFirestorePost(postDoc.id, postDoc.data());
    return post ? [post] : [];
  });
}

/** Resolve the target post independently of the feed's paginated first page. */
export async function getMapPostById(postId: string): Promise<FeedPost | null> {
  if (!postId.trim() || postId.includes("/")) return null;
  const snapshot = await getDocFromServer(doc(db, "posts", postId));
  if (!snapshot.exists()) return null;
  return normalizeFirestorePost(snapshot.id, snapshot.data());
}
