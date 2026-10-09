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
      const matchesName = post.location.name.toLowerCase().includes(query);
      if (!matchesName) return false;
    }

    // Filter by Latitude/Longitude radius
    if (
      typeof filter.latitude === "number" &&
      typeof filter.longitude === "number" &&
      typeof filter.radiusKm === "number"
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