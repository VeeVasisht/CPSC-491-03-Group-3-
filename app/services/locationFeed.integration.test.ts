import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { 
  initializeTestEnvironment, 
  type RulesTestEnvironment 
} from "@firebase/rules-unit-testing";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";
import { getLocationFeed } from "./locationFeedService";

let testEnv: RulesTestEnvironment;
let db: any;

beforeAll(async () => {
  const address = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  const [host, rawPort] = address.split(":");
  
  testEnv = await initializeTestEnvironment({
    projectId: "demo-wetravel-location-feed",
    firestore: {
      host,
      port: Number(rawPort),
      rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8"),
    },
  });

  db = testEnv.authenticatedContext("test-user", { email: "test@example.com" }).firestore();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv?.cleanup();
});

describe("Location Feed Firestore Integration Tests", () => {
  it(
    "queries and filters posts by region name from Firestore",
    async () => {
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
    },
    15000
  );

  it(
    "returns empty result when no posts match region",
    async () => {
      const feed = await getLocationFeed({ regionName: "NonExistentRegion999" });
      expect(feed).toEqual([]);
    },
    15000
  );
});