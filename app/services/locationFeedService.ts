import { collection, getDocsFromServer, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  filterPostsByLocation,
  type LocationFeedFilter,
  type LocationFeedPost,
} from "../models/locationFeed";
import { validateGeotag, normalizeGeotag } from "../models/geotag";

const CACHE_KEY_PREFIX = "wetravel_location_feed_cache_";

function getCachedLocationFeed(filter: LocationFeedFilter): LocationFeedPost[] | null {
  try {
    const key = `${CACHE_KEY_PREFIX}${JSON.stringify(filter)}`;
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return null;

    const parsed = JSON.parse(cachedData);
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.posts;
  } catch (err) {
    console.error("Failed to read location feed from cache:", err);
    return null;
  }
}

function setCachedLocationFeed(filter: LocationFeedFilter, posts: LocationFeedPost[]): void {
  try {
    const key = `${CACHE_KEY_PREFIX}${JSON.stringify(filter)}`;
    const payload = {
      timestamp: Date.now(),
      posts,
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to write location feed to cache:", err);
  }
}


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
          rawPosts.push({
            id: docSnap.id,
            authorId: data.authorId ?? "",
            title: data.title ?? "",
            description: data.description ?? "",
            imageUrl: data.imageUrl ?? "",
            location: normalizeGeotag(data.location),
            createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
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