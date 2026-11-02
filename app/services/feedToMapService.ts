
import type { Geotag } from "../models/geotag";

import {
  normalizeGeotag,
  validateGeotag,
} from "../models/geotag";

export function canOpenLocationOnMap(
  geotag: Geotag | null | undefined,
): boolean {
  if (!geotag) {
    return false;
  }

  return validateGeotag(geotag).valid;
}

export function getMapLocationFromGeotag(
  geotag: Geotag | null | undefined,
): Geotag {
  if (!geotag) {
    throw new Error(
      "This post does not have a location.",
    );
  }

  const validation = validateGeotag(geotag);

  if (!validation.valid) {
    throw new Error(
      "This post has invalid location data.",
    );
  }

  return normalizeGeotag(geotag);
}

export function buildMapUrl(
  geotag: Geotag | null | undefined,
): string {
  const location = getMapLocationFromGeotag(geotag);

  const params = new URLSearchParams({
    lat: String(location.latitude),
    lng: String(location.longitude),
    name: location.name,
  });

  return `/map?${params.toString()}`;
}
