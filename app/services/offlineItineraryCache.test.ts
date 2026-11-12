import { beforeEach, describe, expect, it } from "vitest";
import {
  clearOfflineItineraries, offlineCacheKey, readOfflineItineraries,
  upsertOfflineItinerary, writeOfflineItineraries,
} from "./offlineItineraryCache";

const trip = {
  id: "trip-1", title: "Japan Spring Trip",
  destinations: [{ id: "tokyo", location: { name: "Tokyo", latitude: 35.6595, longitude: 139.7005 }, postId: null }],
};

beforeEach(() => window.localStorage.clear());

describe("Sprint 5 offline itinerary cache", () => {
  it("stores and restores a trip with its location", () => {
    expect(writeOfflineItineraries("user-a", [trip])).toBe(true);
    expect(readOfflineItineraries("user-a")).toEqual([trip]);
  });
  it("isolates cached trips by user", () => {
    writeOfflineItineraries("user-a", [trip]);
    expect(readOfflineItineraries("user-b")).toEqual([]);
  });
  it("updates an existing trip without duplicates", () => {
    upsertOfflineItinerary("user-a", trip);
    upsertOfflineItinerary("user-a", { ...trip, title: "Updated" });
    expect(readOfflineItineraries("user-a")).toHaveLength(1);
    expect(readOfflineItineraries("user-a")[0].title).toBe("Updated");
  });
  it("rejects invalid coordinates instead of caching them", () => {
    expect(writeOfflineItineraries("user-a", [{ ...trip, destinations: [
      { ...trip.destinations[0], location: { name: "Bad", latitude: 91, longitude: 0 } },
    ] }])).toBe(false);
  });
  it("ignores corrupted cache data", () => {
    window.localStorage.setItem(offlineCacheKey("user-a"), "not json");
    expect(readOfflineItineraries("user-a")).toEqual([]);
  });
  it("can clear cached trips", () => {
    writeOfflineItineraries("user-a", [trip]);
    clearOfflineItineraries("user-a");
    expect(readOfflineItineraries("user-a")).toEqual([]);
  });
});
