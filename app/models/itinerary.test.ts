import {
  describe,
  expect,
  it,
} from "vitest";

import {
  addDestination,
  moveDestination,
  normalizeDestinations,
  removeDestination,
  type ItineraryDestination,
} from "./itinerary";

const a: ItineraryDestination = {
  id: "a",
  location: {
    name: " Irvine ",
    latitude: 33.68,
    longitude: -117.82,
  },
  postId: null,
};

const b: ItineraryDestination = {
  id: "b",
  location: {
    name: "Paris",
    latitude: 48.85,
    longitude: 2.35,
  },
  postId: "post-1",
};

describe("itinerary organization", () => {
  it("normalizes location names", () => {
    expect(
      normalizeDestinations([a])[0].location.name,
    ).toBe("Irvine");
  });

  it("adds destinations", () => {
    expect(addDestination([a], b)).toHaveLength(2);
  });

  it("moves destinations", () => {
    expect(
      moveDestination([a, b], "b", -1).map(
        (item) => item.id,
      ),
    ).toEqual(["b", "a"]);
  });

  it("keeps items in bounds", () => {
    expect(
      moveDestination([a, b], "a", -1).map(
        (item) => item.id,
      ),
    ).toEqual(["a", "b"]);
  });

  it("removes destinations", () => {
    expect(
      removeDestination([a, b], "a").map(
        (item) => item.id,
      ),
    ).toEqual(["b"]);
  });

  it("rejects duplicate IDs", () => {
    expect(() =>
      normalizeDestinations([a, a]),
    ).toThrow("unique");
  });

  it("rejects invalid coordinates", () => {
    expect(() =>
      addDestination([], {
        ...a,
        location: {
          ...a.location,
          latitude: 100,
        },
      }),
    ).toThrow("valid destination");
  });

  it("rejects empty post IDs", () => {
    expect(() =>
      normalizeDestinations([
        {
          ...a,
          postId: " ",
        },
      ]),
    ).toThrow("Post ID");
  });

  it("rejects more than 100 destinations", () => {
    const destinations = Array.from(
      { length: 101 },
      (_, index) => ({
        ...a,
        id: String(index),
      }),
    );

    expect(() =>
      normalizeDestinations(destinations),
    ).toThrow("100");
  });
});
