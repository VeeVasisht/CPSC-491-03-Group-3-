// @vitest-environment node
// Run with: firebase emulators:exec --only firestore "npx vitest run app/trips/trip.integration.test.ts"
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
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
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

// IMPORTANT: This suite tests the actual Firestore rules, not a mocked service.
// It requires the Firestore Emulator. Never connect these tests to production.
const PROJECT_ID = "demo-wetravel-trip-tests";
const OWNER_UID = "trip-owner";
const OTHER_UID = "another-user";

let testEnv: RulesTestEnvironment;
type TestFirestore = ReturnType<
  ReturnType<RulesTestEnvironment["authenticatedContext"]>["firestore"]
>;
let ownerDb: TestFirestore;
let otherDb: TestFirestore;
let guestDb: TestFirestore;

// The rules require exactly these fields and server-managed timestamps.
function validTrip(ownerId = OWNER_UID) {
  return {
    ownerId,
    title: "Japan Vacation",
    description: "Exploring Tokyo and Kyoto",
    destination: "Japan",
    startDate: "2026-11-10",
    endDate: "2026-11-16",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

// Create a legitimate trip with rules enforced, using the owner's identity.
async function createOwnedTrip(id = "trip-1") {
  const ref = doc(ownerDb, "trips", id);
  await assertSucceeds(setDoc(ref, validTrip()));
  return ref;
}

beforeAll(async () => {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (!emulatorHost) {
    throw new Error(
      'FIRESTORE_EMULATOR_HOST is not set. Run: firebase emulators:exec --only firestore "npx vitest run app/trips/trip.integration.test.ts"',
    );
  }

  const [host, portText] = emulatorHost.split(":");
  const port = Number(portText);
  if (!host || !Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid FIRESTORE_EMULATOR_HOST: ${emulatorHost}`);
  }

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host,
      port,
      rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8"),
    },
  });
  ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
  otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
  guestDb = testEnv.unauthenticatedContext().firestore();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv?.cleanup();
});

describe("Trip Firestore integration (security rules)", () => {
  it("allows the owner to create and read a trip with required metadata", async () => {
    const ref = await createOwnedTrip();
    const snapshot = await assertSucceeds(getDoc(ref));

    expect(snapshot.exists()).toBe(true);
    expect(snapshot.data()).toMatchObject({
      ownerId: OWNER_UID,
      title: "Japan Vacation",
      destination: "Japan",
      startDate: "2026-11-10",
      endDate: "2026-11-16",
    });
    expect(snapshot.data()?.createdAt).toBeDefined();
    expect(snapshot.data()?.updatedAt).toBeDefined();
  });

  it("allows owner-scoped queries but denies queries without an owner filter", async () => {
    await createOwnedTrip();
    const otherRef = doc(otherDb, "trips", "trip-2");
    await assertSucceeds(setDoc(otherRef, validTrip(OTHER_UID)));

    const results = await assertSucceeds(
      getDocs(
        query(collection(ownerDb, "trips"), where("ownerId", "==", OWNER_UID)),
      ),
    );
    expect(results.docs.map((snapshot) => snapshot.id)).toEqual(["trip-1"]);

    await assertFails(getDocs(collection(ownerDb, "trips")));
    await assertFails(
      getDocs(
        query(collection(ownerDb, "trips"), where("ownerId", "==", OTHER_UID)),
      ),
    );
  });

  it("allows the owner to edit allowed fields and update the timestamp", async () => {
    const ref = await createOwnedTrip();
    const initial = (await getDoc(ref)).data();

    await assertSucceeds(
      updateDoc(ref, {
        title: "Updated Japan Vacation",
        destination: "Tokyo, Japan",
        updatedAt: serverTimestamp(),
      }),
    );

    const updated = (await assertSucceeds(getDoc(ref))).data();
    expect(updated?.title).toBe("Updated Japan Vacation");
    expect(updated?.destination).toBe("Tokyo, Japan");
    expect(updated?.createdAt).toEqual(initial?.createdAt);
  });

  it("allows the owner to delete their own trip", async () => {
    const ref = await createOwnedTrip();

    await assertSucceeds(deleteDoc(ref));

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const snapshot = await getDoc(
        doc(context.firestore(), "trips", "trip-1"),
      );

      expect(snapshot.exists()).toBe(false);
    });
  });

  it("rejects unauthenticated create, read, update, and delete", async () => {
    await createOwnedTrip();
    const guestRef = doc(guestDb, "trips", "trip-1");

    await assertFails(
      setDoc(doc(guestDb, "trips", "guest-trip"), validTrip()),
    );
    await assertFails(getDoc(guestRef));
    await assertFails(
      updateDoc(guestRef, { title: "Changed", updatedAt: serverTimestamp() }),
    );
    await assertFails(deleteDoc(guestRef));
  });

  it("prevents other users from reading, changing, or deleting a trip", async () => {
    await createOwnedTrip();
    const otherRef = doc(otherDb, "trips", "trip-1");

    await assertFails(getDoc(otherRef));
    await assertFails(
      updateDoc(otherRef, { title: "Hacked", updatedAt: serverTimestamp() }),
    );
    await assertFails(deleteDoc(otherRef));
  });

  it("rejects creating a trip on another user's behalf", async () => {
    await assertFails(
      setDoc(doc(otherDb, "trips", "fake-trip"), validTrip(OWNER_UID)),
    );
  });

  it("rejects blank or missing destinations and missing required fields", async () => {
    const blank = { ...validTrip(), destination: "" };
    const { destination: _ignored, ...missing } = validTrip();

    await assertFails(
      setDoc(doc(ownerDb, "trips", "blank-destination"), blank),
    );
    await assertFails(
      setDoc(doc(ownerDb, "trips", "missing-destination"), missing),
    );
    await assertFails(
      setDoc(doc(ownerDb, "trips", "blank-title"), {
        ...validTrip(),
        title: "",
      }),
    );
  });

  it("rejects invalid date format or an end date before the start date", async () => {
    await assertFails(
      setDoc(doc(ownerDb, "trips", "bad-format"), {
        ...validTrip(),
        startDate: "11/10/2026",
      }),
    );
    await assertFails(
      setDoc(doc(ownerDb, "trips", "bad-range"), {
        ...validTrip(),
        startDate: "2026-11-16",
        endDate: "2026-11-10",
      }),
    );
  });

  it("rejects unexpected fields and an overlong destination", async () => {
    await assertFails(
      setDoc(doc(ownerDb, "trips", "unexpected-field"), {
        ...validTrip(),
        isAdmin: true,
      }),
    );
    await assertFails(
      setDoc(doc(ownerDb, "trips", "long-destination"), {
        ...validTrip(),
        destination: "A".repeat(151),
      }),
    );
  });

  it("rejects attempts to change ownerId or createdAt", async () => {
    const ref = await createOwnedTrip();
    await assertFails(
      updateDoc(ref, { ownerId: OTHER_UID, updatedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(ref, {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("requires a server timestamp for updatedAt on update", async () => {
    const ref = await createOwnedTrip();
    await assertFails(updateDoc(ref, { title: "Edited without timestamp" }));
  });

  it("denies day and activity subcollection access until those rules are added", async () => {
    await createOwnedTrip();
    const dayRef = doc(ownerDb, "trips", "trip-1", "days", "day-1");
    const activityRef = doc(
      ownerDb,
      "trips",
      "trip-1",
      "days",
      "day-1",
      "activities",
      "activity-1",
    );
    await assertFails(setDoc(dayRef, { title: "Day 1" }));
    await assertFails(setDoc(activityRef, { title: "Museum" }));
  });
});
