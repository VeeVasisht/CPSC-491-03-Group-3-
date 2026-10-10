import { collection, getDocsFromServer, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  filterPostsByLocation,
  type LocationFeedFilter,
  type LocationFeedPost,
} from "../models/locationFeed";
import { validateGeotag, normalizeGeotag } from "../models/geotag";

/**
 * Retrieves geotagged posts from the server and applies location and proximity filters.
 */
export async function getLocationFeed(
  filter: LocationFeedFilter,
): Promise<LocationFeedPost[]> {
  try {
    const postsRef = collection(db, "posts");
    // Fetch posts where location field is attached using server fetch
    const q = query(postsRef, where("location", "!=", null));
    const snapshot = await getDocsFromServer(q);

    const rawPosts: LocationFeedPost[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.location) {
        // Validate geotag coordinates and structure
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

    // Apply distance/region filter and sort newest-first
    const filtered = filterPostsByLocation(rawPosts, filter);
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching location feed:", error);
    throw new Error("Unable to load location-based feed.");
  }
}