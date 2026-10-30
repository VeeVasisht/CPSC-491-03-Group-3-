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


  // Not finished yet, will code more later!