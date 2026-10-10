import type { Geotag } from "./geotag";

export interface LocationFeedPost {
  id: string;
  authorId: string;
  title: string;
  description: string;
  imageUrl: string;
  location: Geotag;
  createdAt: number;
}

export interface LocationFeedFilter {
  regionName?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

/**
 * Calculates distance between 2 latitude/longitude pairs using Haversine formula (in kilometers).
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Filters feed posts based on geographic region name or lat/lon radius proximity.
 */
export function filterPostsByLocation(
  posts: LocationFeedPost[],
  filter: LocationFeedFilter,
): LocationFeedPost[] {
  return posts.filter((post) => {
    if (!post.location) return false;

    // Filter by Region Name query
    if (filter.regionName && filter.regionName.trim() !== "") {
      const query = filter.regionName.trim().toLowerCase();
      const locationName =
        typeof post.location.name === "string"
        ? post.location.name.trim().toLowerCase()
        : "";

      if (!locationName || !locationName.includes(query)) {
        return false;
      }
    }

    // Filter by Latitude/Longitude radius with Number.isFinite & non-negative radius checks
    if (
      typeof filter.latitude === "number" &&
      Number.isFinite(filter.latitude) &&
      typeof filter.longitude === "number" &&
      Number.isFinite(filter.longitude) &&
      typeof filter.radiusKm === "number" &&
      Number.isFinite(filter.radiusKm) &&
      filter.radiusKm >= 0 &&
      typeof post.location.latitude === "number" &&
      Number.isFinite(filter.post.location.latitude) &&
      typeof post.location.longitude === "number" &&
      Number.isFinite(filter.post.location.longitude)
    ) {
      const distance = calculateHaversineDistanceKm(
        filter.latitude,
        filter.longitude,
        post.location.latitude,
        post.location.longitude,
      );
      if (distance > filter.radiusKm) return false;
    }

    return true;
  });
}