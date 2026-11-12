import { normalizeDestinations, type OrganizedItinerary } from "../models/itinerary";

const PREFIX = "wetravel:offline-itineraries:v1:";
const MAX_TRIPS = 50;

export function offlineCacheKey(userId: string): string {
  if (!userId.trim()) throw new Error("User ID is required.");
  return PREFIX + encodeURIComponent(userId);
}

export function readOfflineItineraries(userId: string): OrganizedItinerary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(offlineCacheKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length > MAX_TRIPS) return [];
    return parsed.map((value: unknown) => {
      if (!value || typeof value !== "object") throw new Error("Invalid cached trip.");
      const trip = value as Record<string, unknown>;
      if (typeof trip.id !== "string" || !trip.id.trim() ||
          typeof trip.title !== "string" || !trip.title.trim() ||
          trip.title.length > 100 || !Array.isArray(trip.destinations)) {
        throw new Error("Invalid cached trip.");
      }
      return {
        id: trip.id,
        title: trip.title,
        destinations: normalizeDestinations(trip.destinations),
      };
    });
  } catch {
    return [];
  }
}

export function writeOfflineItineraries(userId: string, trips: OrganizedItinerary[]): boolean {
  if (typeof window === "undefined" || trips.length > MAX_TRIPS) return false;
  try {
    const sanitized = trips.map((trip) => {
      if (!trip.id.trim() || !trip.title.trim() || trip.title.length > 100) {
        throw new Error("Invalid itinerary.");
      }
      return { id: trip.id, title: trip.title, destinations: normalizeDestinations(trip.destinations) };
    });
    window.localStorage.setItem(offlineCacheKey(userId), JSON.stringify(sanitized));
    return true;
  } catch {
    return false;
  }
}

export function upsertOfflineItinerary(userId: string, trip: OrganizedItinerary): boolean {
  const current = readOfflineItineraries(userId);
  const next = current.filter((item) => item.id !== trip.id);
  return writeOfflineItineraries(userId, [...next, trip]);
}

export function clearOfflineItineraries(userId: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(offlineCacheKey(userId)); } catch
}
