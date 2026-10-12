
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
 * Calculates distance between 2 latitude/longitude pairs
 * using the Haversine formula (in kilometers).
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
 * Filters feed posts based on geographic region name
 * or latitude/longitude radius proximity.
 *
 * Invalid coordinates and radius values are rejected
 * before calculating Haversine distance.
 */
export function filterPostsByLocation(
  posts: LocationFeedPost[],
  filter: LocationFeedFilter,
): LocationFeedPost[] {
  return posts.filter((post) => {
    // Ignore posts without location information.
    if (!post.location) return false;

    // Filter by Region Name query.
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

    // Determine whether a radius-based filter was requested.
    const hasRadiusFilter =
      filter.latitude !== undefined ||
      filter.longitude !== undefined ||
      filter.radiusKm !== undefined;

    if (hasRadiusFilter) {
      const { latitude, longitude, radiusKm } = filter;

      // Validate filter coordinates and radius.
      if (
        typeof latitude !== "number" ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        typeof longitude !== "number" ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180 ||
        typeof radiusKm !== "number" ||
        !Number.isFinite(radiusKm) ||
        radiusKm < 0
      ) {
        return false;
      }

      // Validate the post's coordinates.
      const postLat = post.location.latitude;
      const postLon = post.location.longitude;

      if (
        typeof postLat !== "number" ||
        !Number.isFinite(postLat) ||
        postLat < -90 ||
        postLat > 90 ||
        typeof postLon !== "number" ||
        !Number.isFinite(postLon) ||
        postLon < -180 ||
        postLon > 180
      ) {
        return false;
      }

      // Calculate distance only after validating all inputs.
      const distance = calculateHaversineDistanceKm(
        latitude,
        longitude,
        postLat,
        postLon,
      );

      // Exclude posts outside the requested radius.
      if (distance > radiusKm) {
        return false;
      }
    }

    // Post passed all applicable filters.
    return true;
  });
}
