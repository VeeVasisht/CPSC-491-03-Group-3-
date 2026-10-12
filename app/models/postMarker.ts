import type { FeedPost } from "./feed";
import { normalizeGeotag, validateGeotag, type Geotag } from "./geotag";

/** A post location plus just the fields the map preview needs. */
export interface PostMarker {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  location: Geotag;
}

/**
 * Convert feed-shaped posts into safe map markers. The feed model already
 * normalizes geotags, but revalidate here because other callers may supply
 * older Firestore records or incomplete data.
 */
export function toPostMarkers(posts: readonly FeedPost[]): PostMarker[] {
  const markers: PostMarker[] = [];

  for (const post of posts) {
    const location = post.location;
    if (!post.id?.trim() || !location ||
      typeof location.name !== "string" ||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number" ||
      !validateGeotag(location).valid) {
      continue;
    }

    markers.push({
      id: post.id,
      title: post.title || "Untitled post",
      description: post.description,
      imageUrl: post.imageUrl,
      location: normalizeGeotag(location),
    });
  }

  return markers;
}
