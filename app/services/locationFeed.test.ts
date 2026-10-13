// app/services/locationFeed.integration.test.ts

import { beforeAll, describe, expect, it } from "vitest";
import { connectFirestoreEmulator, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getLocationFeed } from "./locationFeedService";

beforeAll(() => {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  } catch {}
});

describe("Location Feed Integration Tests", () => {
  it("queries and filters posts by region name from Firestore", async () => {
    const postId = `test-post-${Date.now()}`;
    await setDoc(doc(db, "posts", postId), {
      authorId: "user-1",
      title: "Irvine Park Visit",
      description: "Great sunny day in Irvine.",
      imageUrl: "https://example.com/img.png",
      location: {
        name: "Irvine, CA",
        latitude: 33.6846,
        longitude: -117.8265,
      },
      createdAt: serverTimestamp(),
    });

    const feed = await getLocationFeed({ regionName: "Irvine" });
    expect(feed.length).toBeGreaterThan(0);
    expect(feed.some((p) => p.id === postId)).toBe(true);
  });

  it("returns empty result when no posts match region", async () => {
    const feed = await getLocationFeed({ regionName: "NonExistentRegion999" });
    expect(feed).toEqual([]);
  });
});