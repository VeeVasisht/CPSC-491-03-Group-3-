import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normalizeGeotag,
  validateGeotag,
} from "./geotag";

describe("validateGeotag", () => {
  it("accepts valid location data", () => {
    const result = validateGeotag({
      name: "Irvine, CA",
      latitude: 33.6846,
      longitude: -117.8265,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("rejects an empty location name", () => {
    const result = validateGeotag({
      name: "   ",
      latitude: 33.6846,
      longitude: -117.8265,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe(
      "Location name is required.",
    );
  });

  it("rejects latitude above 90", () => {
    const result = validateGeotag({
      name: "Test",
      latitude: 91,
      longitude: 0,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.latitude).toBeDefined();
  });

  it("rejects latitude below -90", () => {
    const result = validateGeotag({
      name: "Test",
      latitude: -91,
      longitude: 0,
    });

    expect(result.valid).toBe(false);
  });

  it("rejects longitude above 180", () => {
    const result = validateGeotag({
      name: "Test",
      latitude: 0,
      longitude: 181,
    });

    expect(result.valid).toBe(false);
  });

  it("rejects longitude below -180", () => {
    const result = validateGeotag({
      name: "Test",
      latitude: 0,
      longitude: -181,
    });

    expect(result.valid).toBe(false);
  });

  it("accepts coordinate boundaries", () => {
    expect(
      validateGeotag({
        name: "Boundary",
        latitude: 90,
        longitude: 180,
      }).valid,
    ).toBe(true);

    expect(
      validateGeotag({
        name: "Boundary",
        latitude: -90,
        longitude: -180,
      }).valid,
    ).toBe(true);
  });

  it("rejects non-finite coordinates", () => {
    expect(
      validateGeotag({
        name: "Test",
        latitude: Number.NaN,
        longitude: 0,
      }).valid,
    ).toBe(false);
  });
});

describe("normalizeGeotag", () => {
  it("trims the location name", () => {
    expect(
      normalizeGeotag({
        name: "  Irvine, CA  ",
        latitude: 33.6846,
        longitude: -117.8265,
      }),
    ).toEqual({
      name: "Irvine, CA",
      latitude: 33.6846,
      longitude: -117.8265,
    });
  });
});
