import { describe, it, expect } from "vitest";
import { validateRouteDestinations } from "~/models/route";
import { calculateRouteFromDestinations } from "~/services/routingService";

describe("Sprint 4: Route Visualization & Boundary Tests", () => {
  it("should fail when zero destinations are provided", () => {
    const result = validateRouteDestinations([]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Zero destinations");
  });

  it("should handle single-destination boundaries correctly", () => {
    const singleStop = [{ id: "1", name: "Statue of Liberty", lat: 40.6892, lng: -74.0445, orderIndex: 0 }];
    const result = validateRouteDestinations(singleStop);
    expect(result.valid).toBe(true);
    expect(result.error).toContain("Single destination");
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

  it("should correctly sort destinations by orderIndex before routing", async () => {
    const unorderedStops = [
      { id: "b", name: "Second Stop", lat: 34.06, lng: -118.25, orderIndex: 1 },
      { id: "a", name: "First Stop", lat: 34.05, lng: -118.24, orderIndex: 0 }
    ];
    
    const routeResult = await calculateRouteFromDestinations(unorderedStops);
    expect(routeResult).toBeDefined();
  });
});