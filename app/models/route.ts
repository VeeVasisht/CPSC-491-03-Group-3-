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

  for (destinations) {
    
  }
  return { valid: true };
}