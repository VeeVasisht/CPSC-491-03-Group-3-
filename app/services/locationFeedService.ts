// app/services/locationFeedService.ts

import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  filterPostsByLocation,
  type LocationFeedFilter,
  type LocationFeedPost,
} from "../models/locationFeed";

/**
 * Retrieves geotagged posts and applies location and proximity filters.
 */
export async function getLocationFeed(
  filter: LocationFeedFilter,
): Promise<LocationFeedPost[]> {
  try {
    const postsRef = collection(db, "posts");
    // Fetch posts where location field is attached
    const q = query(postsRef, where("location", "!=", null));
    const snapshot = await getDocs(q);

    const rawPosts: LocationFeedPost[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        authorId: data.authorId ?? "",
        title: data.title ?? "",
        description: data.description ?? "",
        imageUrl: data.imageUrl ?? "",
        location: data.location,
        createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
      };
    });

    // Apply distance/region filter and sort newest-first
    const filtered = filterPostsByLocation(rawPosts, filter);
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching location feed:", error);
    throw new Error("Unable to load location-based feed.");
  }
}