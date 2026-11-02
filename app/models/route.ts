export interface Destination {
  id: string;
  name: string;
  lat: number;
  lng: number;
  orderIndex: number;
}

export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface RouteSegment {
  distanceMeters: number;
  durationSeconds: number;
  polylinePoints: RouteCoordinate[];
}

export interface RouteResult {
  success: boolean;
  segments: RouteSegment[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  error?: string;
}

export function validateRouteDestinations(destinations: Destination[]): { valid: boolean; error?: string } {
  if (!destinations || destinations.length === 0) {
    return { valid: false, error: "Zero destinations provided. Cannot generate a route." };
  }
  
  if (destinations.length === 1) {
    return { valid: true, error: "Single destination loaded: displaying marker only." };
  }

  for (const dest of destinations) {
    if (
      typeof dest.lat !== 'number' || typeof dest.lng !== 'number' ||
      isNaN(dest.lat) || isNaN(dest.lng) ||
      dest.lat < -90 || dest.lat > 90 || dest.lng < -180 || dest.lng > 180
    ) {
      return { valid: false, error: `Invalid geographic coordinates for destination: "${dest.name || dest.id}"` };
    }
  }

  return { valid: true };
}