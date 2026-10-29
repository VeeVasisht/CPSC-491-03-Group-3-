import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateGeotag,
} from "./geotag";

import {
  addDestination,
  normalizeDestinations,
  type ItineraryDestination,
} from "./itinerary";

const valid = () => ({
  name: "Irvine",
  latitude: 33.68,
  longitude: -117.82,
});

const destination = (
  overrides: Partial<ItineraryDestination> = {},
): ItineraryDestination => ({
  id: "destination-1",
  location: valid(),
  postId: null,
  ...overrides,
});

describe(
  "Sprint 4 SOC 2 PI1.3: input validation",
  () => {
    it("accepts a valid location", () => {
      expect(
        validateGeotag(valid()).valid,
      ).toBe(true);
    });

    it(
      "rejects empty or whitespace-only location names",
      () => {
        for (const name of ["", "   "]) {
          expect(
            validateGeotag({
              ...valid(),
              name,
            }).valid,
          ).toBe(false);
        }
      },
    );

    it("rejects latitudes outside -90 to 90", () => {
      for (const latitude of [-90.01, 90.01]) {
        expect(
          validateGeotag({
            ...valid(),
            latitude,
          }).valid,
        ).toBe(false);
      }
    });

    it("rejects longitudes outside -180 to 180", () => {
      for (const longitude of [-180.01, 180.01]) {
        expect(
          validateGeotag({
            ...valid(),
            longitude,
          }).valid,
        ).toBe(false);
      }
    });

    it("accepts coordinate boundary values", () => {
      const boundaries = [
        [-90, -180],
        [90, 180],
      ];

      for (const [latitude, longitude] of boundaries) {
        expect(
          validateGeotag({
            ...valid(),
            latitude,
            longitude,
          }).valid,
        ).toBe(true);
      }
    });

    it("rejects NaN and infinite coordinates", () => {
      for (const latitude of [
        NaN,
        Infinity,
        -Infinity,
      ]) {
        expect(
          validateGeotag({
            ...valid(),
            latitude,
          }).valid,
        ).toBe(false);
      }

      for (const longitude of [
        NaN,
        Infinity,
        -Infinity,
      ]) {
        expect(
          validateGeotag({
            ...valid(),
            longitude,
          }).valid,
        ).toBe(false);
      }
    });

    it("rejects invalid itinerary destination locations", () => {
      expect(() =>
        addDestination(
          [],
          destination({
            location: {
              ...valid(),
              latitude: 91,
            },
          }),
        ),
      ).toThrow();

      expect(() =>
        addDestination(
          [],
          destination({
            location: {
              ...valid(),
              name: " ",
            },
          }),
        ),
      ).toThrow();
    });

    it(
      "rejects empty destination IDs and duplicate destination IDs",
      () => {
        expect(() =>
          addDestination(
            [],
            destination({
              id: " ",
            }),
          ),
        ).toThrow();

        expect(() =>
          normalizeDestinations([
            destination(),
            destination(),
          ]),
        ).toThrow();
      },
    );

    it("rejects empty non-null post IDs", () => {
      expect(() =>
        addDestination(
          [],
          destination({
            postId: " ",
          }),
        ),
      ).toThrow();
    });

    it("rejects itineraries with more than 100 destinations", () => {
      const items = Array.from(
        { length: 101 },
        (_, index) =>
          destination({
            id: `destination-${index}`,
          }),
      );

      expect(() =>
        normalizeDestinations(items),
      ).toThrow();
    });
  },
);
