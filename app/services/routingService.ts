import type { Destination, RouteResult, RouteSegment, RouteCoordinate } from "~/models/route";
import { validateRouteDestinations } from "~/models/route";


function decodePolyline(encoded: string): RouteCoordinate[] {
  let points: RouteCoordinate[] = [ ];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) !== ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) !== ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

export async function calculateRouteFromDestinations(destinations: Destination[]): Promise<RouteResult> {
  if (destinations && destinations.length === 1) {
    return {
      success: true,
      segments: [],
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
    };
  }

  const validation = validateRouteDestinations(destinations);
  if (!validation.valid) {
    return {
      success: false,
      segments: [],
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      error: validation.error,
    };
  }

  const sortedDestinations = [...destinations].sort((a, b) => a.orderIndex - b.orderIndex);

  try {
    const coordinatesQuery = sortedDestinations.map(d => `${d.lng},${d.lat}`).join(";");
    
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesQuery}?overview=full&geometries=polyline`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Routing service request failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error("No route found between the provided destinations.");
    }

    const route = data.routes[0];
    const segments: RouteSegment[] = route.legs.map((leg: any) => ({
      distanceMeters: leg.distance,
      durationSeconds: leg.duration,
      polylinePoints: decodePolyline(route.geometry)
    }));

    const totalDistanceMeters = route.distance;
    const totalDurationSeconds = route.duration;

    return {
      success: true,
      segments,
      totalDistanceMeters,
      totalDurationSeconds,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected routing calculation error occurred.";
    return {
      success: false,
      segments: [],
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      error: errorMessage,
    };
  }
}