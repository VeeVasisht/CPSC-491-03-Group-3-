// @vitest-environment node
// Run with the Firestore Emulator and vitest.integration.config.ts.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const OWNER = "trip-owner";
const OTHER = "other-user";
let testEnv: RulesTestEnvironment;
let ownerDb: ReturnType<
  ReturnType<RulesTestEnvironment["authenticatedContext"]>["firestore"]
>;
let otherDb: typeof ownerDb;
let guestDb: typeof ownerDb;

function trip() {
  return {
    ownerId: OWNER,
    title: "Japan Vacation",
    description: "Exploring Japan",
    destination: "Japan",
    startDate: "2026-11-10",
    endDate: "2026-11-16",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}
function itinerary(title: string) {
  return { title, destinations: [], updatedAt: serverTimestamp() };
}

beforeAll(async () => {
  const address = process.env.FIRESTORE_EMULATOR_HOST;
  if (!address) throw new Error("Run these tests with the Firestore Emulator.");
  const [host, rawPort] = address.split(":");
  testEnv = await initializeTestEnvironment({
    projectId: "demo-wetravel-trip-itineraries",
    firestore: {
      host,
      port: Number(rawPort),
      rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8"),
    },
  });
  ownerDb = testEnv.authenticatedContext(OWNER).firestore();
  otherDb = testEnv.authenticatedContext(OTHER).firestore();
  guestDb = testEnv.unauthenticatedContext().firestore();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await assertSucceeds(setDoc(doc(ownerDb, "trips", "trip-1"), trip()));
});
afterAll(async () => {
  await testEnv?.cleanup();
});

describe("Trip itinerary Firestore integration", () => {
  it("allows multiple itineraries under one owned trip", async () => {
    const first = doc(ownerDb, "trips", "trip-1", "itineraries", "first");
    const second = doc(ownerDb, "trips", "trip-1", "itineraries", "second");
    await assertSucceeds(setDoc(first, itinerary("Museums")));
    await assertSucceeds(setDoc(second, itinerary("Food")));
    await assertSucceeds(getDoc(first));
    await assertSucceeds(getDoc(second));
    await assertSucceeds(
      getDocs(collection(ownerDb, "trips", "trip-1", "itineraries")),
    );
    await assertSucceeds(updateDoc(first, { ...itinerary("Culture") }));
    await assertSucceeds(deleteDoc(second));
  });

  it("rejects another user reading, listing, writing or deleting itineraries", async () => {
    const owned = doc(ownerDb, "trips", "trip-1", "itineraries", "first");
    await assertSucceeds(setDoc(owned, itinerary("Museums")));
    const foreign = doc(otherDb, "trips", "trip-1", "itineraries", "first");
    await assertFails(getDoc(foreign));
    await assertFails(
      getDocs(collection(otherDb, "trips", "trip-1", "itineraries")),
    );
    await assertFails(
      setDoc(
        doc(otherDb, "trips", "trip-1", "itineraries", "second"),
        itinerary("Attack"),
      ),
    );
    await assertFails(updateDoc(foreign, { ...itinerary("Attack") }));
    await assertFails(deleteDoc(foreign));
  });

  it("rejects unauthenticated users and missing parent trips", async () => {
    await assertFails(
      setDoc(
        doc(guestDb, "trips", "trip-1", "itineraries", "anon"),
        itinerary("Anon"),
      ),
    );
    await assertFails(
      setDoc(
        doc(ownerDb, "trips", "missing", "itineraries", "orphan"),
        itinerary("Orphan"),
      ),
    );
  });

  it("validates itinerary metadata", async () => {
    const ref = doc(ownerDb, "trips", "trip-1", "itineraries", "invalid");
    await assertFails(setDoc(ref, { ...itinerary("") }));
    await assertFails(
      setDoc(ref, { ...itinerary("Valid"), destinations: "not a list" }),
    );
    await assertFails(setDoc(ref, { ...itinerary("Valid"), isAdmin: true }));
    await assertFails(
      setDoc(ref, {
        ...itinerary("Valid"),
        destinations: Array(101).fill(null),
      }),
    );
    await assertFails(
      setDoc(ref, {
        title: "Valid",
        destinations: [],
        updatedAt: new Date("2025-01-01"),
      }),
    );
  });
});
