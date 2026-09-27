export interface Geotag {
  name: string;
  latitude: number;
  longitude: number;
}

export interface GeotagFieldErrors {
  name?: string;
  latitude?: string;
  longitude?: string;
}

export interface GeotagValidationResult {
  valid: boolean;
  errors: GeotagFieldErrors;
}

export function validateGeotag(
  geotag: Geotag,
): GeotagValidationResult {
  const errors: GeotagFieldErrors = {};

  const name = geotag.name.trim();

  if (name.length === 0) {
    errors.name = "Location name is required.";
  }

  if (
    !Number.isFinite(geotag.latitude) ||
    geotag.latitude < -90 ||
    geotag.latitude > 90
  ) {
    errors.latitude =
      "Latitude must be between -90 and 90.";
  }

  if (
    !Number.isFinite(geotag.longitude) ||
    geotag.longitude < -180 ||
    geotag.longitude > 180
  ) {
    errors.longitude =
      "Longitude must be between -180 and 180.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function normalizeGeotag(
  geotag: Geotag,
): Geotag {
  return {
    name: geotag.name.trim(),
    latitude: geotag.latitude,
    longitude: geotag.longitude,
  };
}
