import { collection, getDocsFromServer, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  filterPostsByLocation,
  type LocationFeedFilter,
  type LocationFeedPost,
} from "../models/locationFeed";
import { validateGeotag, normalizeGeotag } from "../models/geotag";
import { getCachedLocationFeed, setCachedLocationFeed } from "./locationFeedCache";

export async function getLocationFeed(
  filter: LocationFeedFilter,
): Promise<LocationFeedPost[]> {
  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("location", "!=", null));

  let rawPosts: LocationFeedPost[] = [];

  try {
    const snapshot = await getDocsFromServer(q);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.location) {
        const validation = validateGeotag(data.location);
        if (validation.valid) {
          let createdAtMs = Date.now();
          if (data.createdAt) {
            if (typeof data.createdAt.toMillis === "function") {
              createdAtMs = data.createdAt.toMillis();
            } else if (typeof data.createdAt === "number") {
              createdAtMs = data.createdAt;
            }
          }

          rawPosts.push({
            id: docSnap.id,
            authorId: data.authorId ?? "",
            title: data.title ?? "",
            description: data.description ?? "",
            imageUrl: data.imageUrl ?? "",
            location: normalizeGeotag(data.location),
            createdAt: createdAtMs,
          });
        }
      }
    }

    const filtered = filterPostsByLocation(rawPosts, filter);
    const sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);

    setCachedLocationFeed(filter, sorted);
    return sorted;

  } catch (error) {
    console.warn("Network fetch failed or device is offline. Attempting cache fallback...", error);

    const cachedPosts = getCachedLocationFeed(filter);
    if (cachedPosts) {
      return cachedPosts;
    }

    throw new Error("Unable to load location-based feed and no cached data is available.");
  }
}