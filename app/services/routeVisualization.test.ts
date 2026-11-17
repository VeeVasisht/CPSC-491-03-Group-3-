import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateRouteDestinations } from "../models/route";
import { calculateRouteFromDestinations } from "./routingService";

describe("Sprint 4: Route Visualization & Boundary Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fail when zero destinations are provided", () => {
    const result = validateRouteDestinations([]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Zero destinations");
  });

  it("should handle single-destination boundaries correctly", async () => {
    const singleStop = [{ id: "1", name: "Statue of Liberty", lat: 40.6892, lng: -74.0445, orderIndex: 0 }];
    const result = validateRouteDestinations(singleStop);
    expect(result.valid).toBe(true);

    const routeResult = await calculateRouteFromDestinations(singleStop);
    expect(routeResult.success).toBe(true);
    expect(routeResult.segments).toEqual([]);
  });

  it("should detect and reject invalid geographic coordinates (Negative Testing)", () => {
    const invalidStops = [
      { id: "1", name: "Valid Spot", lat: 34.0522, lng: -118.2437, orderIndex: 0 },
      { id: "2", name: "Bad Latitude", lat: 105.0000, lng: -118.2437, orderIndex: 1 }
    ];
    const result = validateRouteDestinations(invalidStops);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid geographic coordinates");
  });

  it("should correctly sort destinations by orderIndex and handle mock routing calculation", async () => {
    const unorderedStops = [
      { id: "b", name: "Second Stop", lat: 34.06, lng: -118.25, orderIndex: 1 },
      { id: "a", name: "First Stop", lat: 34.05, lng: -118.24, orderIndex: 0 }
    ];
    
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        routes: [
          {
            distance: 1200,
            duration: 300,
            geometry: "u{~vFvyys@_@P",
            legs: [
              { distance: 1200, duration: 300 }
            ]
          }
        ]
      })
    }));

    const routeResult = await calculateRouteFromDestinations(unorderedStops);
    expect(routeResult.success).toBe(true);
    expect(routeResult.totalDistanceMeters).toBe(1200);
    expect(routeResult.segments.length).toBe(1);
  });
});
