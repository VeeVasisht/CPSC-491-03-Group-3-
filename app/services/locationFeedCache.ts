import type { LocationFeedPost, LocationFeedFilter } from "../models/locationFeed";

const CACHE_PREFIX = "wetravel_location_feed_cache_";

export function getCachedLocationFeed(filter: LocationFeedFilter): LocationFeedPost[] | null {
  try {
    const key = `${CACHE_PREFIX}${JSON.stringify(filter)}`;
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return null;

    const parsed = JSON.parse(cachedData);
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.posts;
  } catch (err) {
    console.error("Failed to read location feed cache:", err);
    return null;
  }
}

export function setCachedLocationFeed(filter: LocationFeedFilter, posts: LocationFeedPost[]): void {
  try {
    const key = `${CACHE_PREFIX}${JSON.stringify(filter)}`;
    const payload = {
      timestamp: Date.now(),
      posts,
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to write location feed cache:", err);
  }
}