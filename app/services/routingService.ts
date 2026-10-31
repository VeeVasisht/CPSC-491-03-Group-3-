import { Destination, RouteResult, RouteSegment } from "~/models/route";
import { validateRouteDestinations } from "~/models/route";


export async function calculateRouteFromDestinations(destinations: Destination[]): Promise<RouteResult> {
  const validation = validateRouteDestinations(destinations);
  
  if (!validation.valid) {
    if (destinations.length === 1) {
      return {
        success: true,
        segments: [],
        totalDistanceMeters: 0,
        totalDurationSeconds: 0,
      };
    }
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
    
    // Requesting route data from the external/internal routing service endpoint
    const response = await fetch(`https://api.routing-service.example/v1/directions/${coordinatesQuery}`);
    
    if (!response.ok) {
      throw new Error(`Routing service request failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    const segments: RouteSegment[] = data.routes[0].legs.map((leg: any) => ({
      distanceMeters: leg.distance,
      durationSeconds: leg.duration,
      polylinePoints: decodePolyline(leg.geometry)
    }));

    const totalDistanceMeters = segments.reduce((sum, seg) => sum + seg.distanceMeters, 0);
    const totalDurationSeconds = segments.reduce((sum, seg) => sum + seg.durationSeconds, 0);

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

