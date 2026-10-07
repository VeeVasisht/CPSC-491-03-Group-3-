import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import {
  normalizePost,
  paginateFeed,
  PAGE_SIZE,
  type FeedPage,
} from "../models/feed";

import type { Geotag } from "../models/geotag";

/**
 * Fetch the first page of the feed, newest posts first.
 *
 * Location data is included so a geotagged travel post can be
 * connected to the map.
 */
export async function getFirstFeedPage(): Promise<FeedPage> {
  const postsRef = collection(db, "posts");

  const q = query(
    postsRef,
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE + 1),
  );

  const snapshot = await getDocs(q);

  const posts = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();

    const location =
      data.location &&
      typeof data.location.name === "string" &&
      typeof data.location.latitude === "number" &&
      typeof data.location.longitude === "number"
        ? ({
            name: data.location.name,
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          } satisfies Geotag)
        : null;

    return normalizePost({
      id: docSnap.id,
      authorId: data.authorId,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      createdAt:
        data.createdAt?.toMillis?.() ?? Date.now(),
      updatedAt:
        data.updatedAt?.toMillis?.() ?? undefined,
      location,
    });
  });

  return paginateFeed(posts);
}
