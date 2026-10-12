import { describe, expect, it } from "vitest";
import type { FeedPost } from "./feed";
import { toPostMarkers } from "./postMarker";

const valid: FeedPost = {
  id: "kyoto-post", authorId: "person-1", title: "Kyoto sunset",
  description: "Temple visit", imageUrl: "https://example.com/kyoto.jpg",
  createdAt: 123456, updatedAt: 123456,
  location: { name: "Kyoto, Japan", latitude: 35.0116, longitude: 135.7681 },
};

const changed = (location: FeedPost["location"]): FeedPost => ({ ...valid, location });

describe("Sprint 3 marker creation (S3-TC01..TC03, TC06..TC10)", () => {
  it("S3-TC01: creates a marker for valid post coordinates", () => {
    expect(toPostMarkers([valid])).toEqual([{
      id: valid.id, title: valid.title, description: valid.description,
      imageUrl: valid.imageUrl, location: valid.location,
    }]);
  });

  it("S3-TC02: creates one marker for each valid geotagged post", () => {
    const other: FeedPost = { ...valid, id: "tokyo-post", location: {
      name: "Tokyo", latitude: 35.6762, longitude: 139.6503,
    } };
    expect(toPostMarkers([valid, { ...valid, id: "no-location", location: null }, other])
      .map((post) => post.id)).toEqual(["kyoto-post", "tokyo-post"]);
  });

  it("S3-TC03: keeps each marker associated with its original post record", () => {
    const markers = toPostMarkers([valid, { ...valid, id: "second", title: "Another place" }]);
    expect(markers.map(({ id, title }) => ({ id, title }))).toEqual([
      { id: "kyoto-post", title: "Kyoto sunset" },
      { id: "second", title: "Another place" },
    ]);
  });

  it("S3-TC06: ignores missing latitude safely", () => {
    const malformed = { name: "Kyoto", longitude: 135.7681 };
    expect(toPostMarkers([changed(malformed as unknown as FeedPost["location"])]))
      .toEqual([]);
  });

  it("S3-TC07: ignores missing longitude safely", () => {
    const malformed = { name: "Kyoto", latitude: 35.0116 };
    expect(toPostMarkers([changed(malformed as unknown as FeedPost["location"])]))
      .toEqual([]);
  });

  it("S3-TC08: rejects latitude outside -90..90", () => {
    expect(toPostMarkers([changed({ name: "Bad", latitude: 90.01, longitude: 0 })])).toEqual([]);
    expect(toPostMarkers([changed({ name: "Bad", latitude: -90.01, longitude: 0 })])).toEqual([]);
  });

  it("S3-TC09: rejects longitude outside -180..180", () => {
    expect(toPostMarkers([changed({ name: "Bad", latitude: 0, longitude: 180.01 })])).toEqual([]);
    expect(toPostMarkers([changed({ name: "Bad", latitude: 0, longitude: -180.01 })])).toEqual([]);
  });

  it("S3-TC10: accepts coordinate values exactly on all four boundaries", () => {
    const posts = [
      { name: "NW", latitude: 90, longitude: -180 },
      { name: "NE", latitude: 90, longitude: 180 },
      { name: "SW", latitude: -90, longitude: -180 },
      { name: "SE", latitude: -90, longitude: 180 },
    ].map((location, index) => ({ ...valid, id: `boundary-${index}`, location }));
    expect(toPostMarkers(posts)).toHaveLength(4);
  });

  it("additionally ignores NaN, Infinity, nonnumeric coordinates and blank names", () => {
    const invalid = [
      { name: "A", latitude: NaN, longitude: 1 },
      { name: "B", latitude: 1, longitude: Infinity },
      { name: "C", latitude: "1", longitude: 1 },
      { name: "  ", latitude: 1, longitude: 1 },
    ];
    expect(toPostMarkers(invalid.map((location) => changed(
      location as unknown as FeedPost["location"],
    )))).toEqual([]);
  });
});
