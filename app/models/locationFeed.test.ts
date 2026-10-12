
import { describe, expect, it } from "vitest";
import {
  filterPostsByLocation,
  type LocationFeedPost,
} from "./locationFeed";

describe("Location Feed coordinate validation", () => {
  const post: LocationFeedPost = {
    id: "post-1",
    authorId: "user-1",
    title: "Kyoto Trip",
    description: "Visiting Kyoto",
    imageUrl: "test.jpg",
    location: {
      name: "Kyoto, Japan",
      latitude: 35,
      longitude: 135,
    },
    createdAt: 1,
  };

  it("accepts valid coordinates and radius", () => {
    const result = filterPostsByLocation([post], {
      latitude: 35,
      longitude: 135,
      radiusKm: 10,
    });

    expect(result).toHaveLength(1);
  });

  it("rejects latitude outside valid bounds", () => {
    const result = filterPostsByLocation([post], {
      latitude: 91,
      longitude: 135,
      radiusKm: 10,
    });

    expect(result).toHaveLength(0);
  });

  it("rejects longitude outside valid bounds", () => {
    const result = filterPostsByLocation([post], {
      latitude: 35,
      longitude: -181,
      radiusKm: 10,
    });

    expect(result).toHaveLength(0);
  });

  it("rejects a negative radius", () => {
    const result = filterPostsByLocation([post], {
      latitude: 35,
      longitude: 135,
      radiusKm: -5,
    });

    expect(result).toHaveLength(0);
  });

  it("rejects non-finite values", () => {
    expect(
      filterPostsByLocation([post], {
        latitude: NaN,
        longitude: 135,
        radiusKm: 10,
      }),
    ).toHaveLength(0);

    expect(
      filterPostsByLocation([post], {
        latitude: 35,
        longitude: 135,
        radiusKm: Infinity,
      }),
    ).toHaveLength(0);
  });

  it("rejects incomplete radius filters", () => {
    const result = filterPostsByLocation([post], {
      latitude: 35,
      radiusKm: 10,
    });

    expect(result).toHaveLength(0);
  });

  it("rejects invalid post coordinates", () => {
    const invalidPost: LocationFeedPost = {
      ...post,
      location: {
        ...post.location,
        latitude: 100,
      },
    };

    const result = filterPostsByLocation([invalidPost], {
      latitude: 35,
      longitude: 135,
      radiusKm: 10,
    });

    expect(result).toHaveLength(0);
  });

  it("accepts valid boundary coordinates", () => {
    const boundaryPost: LocationFeedPost = {
      ...post,
      location: {
        ...post.location,
        latitude: 90,
        longitude: 180,
      },
    };

    const result = filterPostsByLocation([boundaryPost], {
      latitude: 90,
      longitude: 180,
      radiusKm: 0,
    });

    expect(result).toHaveLength(1);
  });

  it("preserves region-only filtering", () => {
    const result = filterPostsByLocation([post], {
      regionName: "Kyoto",
    });

    expect(result).toHaveLength(1);
  });
});
