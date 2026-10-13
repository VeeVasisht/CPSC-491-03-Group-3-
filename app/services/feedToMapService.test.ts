import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildMapUrl,
  canOpenLocationOnMap,
  getMapLocationFromGeotag,
} from "./feedToMapService";

describe("canOpenLocationOnMap", () => {
  it("returns true for a valid geotag", () => {
    expect(
      canOpenLocationOnMap({
        name: "Irvine, CA",
        latitude: 33.6846,
        longitude: -117.8265,
      }),
    ).toBe(true);
  });

  it("returns false when the post has no geotag", () => {
    expect(canOpenLocationOnMap(null)).toBe(false);
    expect(canOpenLocationOnMap(undefined)).toBe(false);
  });

  it("returns false for an empty location name", () => {
    expect(
      canOpenLocationOnMap({
        name: "   ",
        latitude: 33.6846,
        longitude: -117.8265,
      }),
    ).toBe(false);
  });

  it("returns false for latitude above 90", () => {
    expect(
      canOpenLocationOnMap({
        name: "Invalid Location",
        latitude: 91,
        longitude: -117.8265,
      }),
    ).toBe(false);
  });

  it("returns false for latitude below -90", () => {
    expect(
      canOpenLocationOnMap({
        name: "Invalid Location",
        latitude: -91,
        longitude: -117.8265,
      }),
    ).toBe(false);
  });

  it("returns false for longitude above 180", () => {
    expect(
      canOpenLocationOnMap({
        name: "Invalid Location",
        latitude: 33.6846,
        longitude: 181,
      }),
    ).toBe(false);
  });

  it("returns false for longitude below -180", () => {
    expect(
      canOpenLocationOnMap({
        name: "Invalid Location",
        latitude: 33.6846,
        longitude: -181,
      }),
    ).toBe(false);
  });

  it("returns false for non-finite coordinates", () => {
    expect(
      canOpenLocationOnMap({
        name: "Invalid Location",
        latitude: Number.NaN,
        longitude: -117.8265,
      }),
    ).toBe(false);
  });
});

describe("getMapLocationFromGeotag", () => {
  it("returns the correct map location", () => {
    const result = getMapLocationFromGeotag({
      name: "Irvine, CA",
      latitude: 33.6846,
      longitude: -117.8265,
    });

    expect(result).toEqual({
      name: "Irvine, CA",
      latitude: 33.6846,
      longitude: -117.8265,
    });
  });

  it("trims the location name", () => {
    const result = getMapLocationFromGeotag({
      name: "  Irvine, CA  ",
      latitude: 33.6846,
      longitude: -117.8265,
    });

    expect(result.name).toBe("Irvine, CA");
  });

  it("keeps the correct latitude and longitude", () => {
    const result = getMapLocationFromGeotag({
      name: "Newport Beach, CA",
      latitude: 33.6189,
      longitude: -117.9298,
    });

    expect(result.latitude).toBe(33.6189);
    expect(result.longitude).toBe(-117.9298);
  });

  it("throws when a post has no location", () => {
    expect(() =>
      getMapLocationFromGeotag(null),
    ).toThrow("This post does not have a location.");
  });

  it("throws when the location is invalid", () => {
    expect(() =>
      getMapLocationFromGeotag({
        name: "Invalid",
        latitude: 100,
        longitude: -117.8265,
      }),
    ).toThrow("This post has invalid location data.");
  });

  it("keeps locations from different posts separate", () => {
    const irvine = getMapLocationFromGeotag({
      name: "Irvine, CA",
      latitude: 33.6846,
      longitude: -117.8265,
    });

    const newport = getMapLocationFromGeotag({
      name: "Newport Beach, CA",
      latitude: 33.6189,
      longitude: -117.9298,
    });

    expect(irvine).not.toEqual(newport);
    expect(irvine.latitude).toBe(33.6846);
    expect(newport.latitude).toBe(33.6189);
  });
});

describe("buildMapUrl", () => {
  it("creates a map URL using the post coordinates", () => {
    const result = buildMapUrl({
      name: "Irvine, CA",
      latitude: 33.6846,
      longitude: -117.8265,
    });

    expect(result).toContain("/map?");
    expect(result).toContain("lat=33.6846");
    expect(result).toContain("lng=-117.8265");
  });

  it("includes the location name in the URL", () => {
    const result = buildMapUrl({
      name: "Irvine, CA",
      latitude: 33.6846,
      longitude: -117.8265,
    });

    const query = result.split("?")[1];
    const params = new URLSearchParams(query);

    expect(params.get("name")).toBe("Irvine, CA");
  });

  it("throws instead of creating a URL for invalid coordinates", () => {
    expect(() =>
      buildMapUrl({
        name: "Invalid Location",
        latitude: 100,
        longitude: 200,
      }),
    ).toThrow("This post has invalid location data.");
  });

  it("throws instead of creating a URL when location is missing", () => {
    expect(() => buildMapUrl(undefined)).toThrow(
      "This post does not have a location.",
    );
  });
});
