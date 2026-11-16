// @vitest-environment node
// Run with: firebase emulators:exec --only firestore "npx vitest run app/firebase/post.integration.test.ts"
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
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

// Tests the real Firestore security rules using the local emulator only.
const PROJECT_ID = "demo-wetravel-post-tests";
const AUTHOR_UID = "post-author";
const OTHER_UID = "another-user";

let testEnv: RulesTestEnvironment;
type TestFirestore = ReturnType<
  ReturnType<RulesTestEnvironment["authenticatedContext"]>["firestore"]
>;
let authorDb: TestFirestore;
let otherDb: TestFirestore;
let guestDb: TestFirestore;

function validPost(authorId = AUTHOR_UID) {
  return {
    authorId,
    title: "Japan Vacation",
    description: "Exploring Tokyo and Kyoto",
    imageUrl: "https://example.com/japan.jpg",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

async function createOwnedPost(id = "post-1") {
  const ref = doc(authorDb, "posts", id);
  await assertSucceeds(setDoc(ref, validPost()));
  return ref;
}

beforeAll(async () => {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (!emulatorHost) {
    throw new Error(
      'FIRESTORE_EMULATOR_HOST is not set. Run: firebase emulators:exec --only firestore "npx vitest run app/firebase/post.integration.test.ts"',
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

  authorDb = testEnv.authenticatedContext(AUTHOR_UID).firestore();
  otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
  guestDb = testEnv.unauthenticatedContext().firestore();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv?.cleanup();
});

describe("Post Firestore integration (security rules)", () => {
  it("allows the author to create and read a post with required metadata", async () => {
    const ref = await createOwnedPost();
    const snapshot = await assertSucceeds(getDoc(ref));

    expect(snapshot.exists()).toBe(true);
    expect(snapshot.data()).toMatchObject({
      authorId: AUTHOR_UID,
      title: "Japan Vacation",
      description: "Exploring Tokyo and Kyoto",
      imageUrl: "https://example.com/japan.jpg",
    });
    expect(snapshot.data()?.createdAt).toBeDefined();
    expect(snapshot.data()?.updatedAt).toBeDefined();
  });

  it("allows anyone, including guests, to read and list public posts", async () => {
    await createOwnedPost();

    const guestSnapshot = await assertSucceeds(
      getDoc(doc(guestDb, "posts", "post-1")),
    );
    const otherSnapshot = await assertSucceeds(
      getDoc(doc(otherDb, "posts", "post-1")),
    );
    const publicResults = await assertSucceeds(
      getDocs(collection(guestDb, "posts")),
    );

    expect(guestSnapshot.exists()).toBe(true);
    expect(otherSnapshot.exists()).toBe(true);
    expect(publicResults.docs.map((snapshot) => snapshot.id)).toEqual([
      "post-1",
    ]);
  });

  it("allows the author to update post content with a server timestamp", async () => {
    const ref = await createOwnedPost();
    const original = (await assertSucceeds(getDoc(ref))).data();

    await assertSucceeds(
      updateDoc(ref, {
        title: "Updated Japan Vacation",
        description: "A revised description",
        imageUrl: "https://example.com/updated.jpg",
        updatedAt: serverTimestamp(),
      }),
    );

    const updated = (await assertSucceeds(getDoc(ref))).data();
    expect(updated?.title).toBe("Updated Japan Vacation");
    expect(updated?.description).toBe("A revised description");
    expect(updated?.createdAt).toEqual(original?.createdAt);
    expect(updated?.authorId).toBe(AUTHOR_UID);
  });

  it("allows the author to delete their own post", async () => {
    const ref = await createOwnedPost();
    await assertSucceeds(deleteDoc(ref));
    const snapshot = await assertSucceeds(getDoc(ref));
    expect(snapshot.exists()).toBe(false);
  });

  it("rejects unauthenticated create, update, and delete operations", async () => {
    await createOwnedPost();
    const guestRef = doc(guestDb, "posts", "post-1");

    await assertFails(setDoc(doc(guestDb, "posts", "guest-post"), validPost()));
    await assertFails(
      updateDoc(guestRef, {
        title: "Unauthorized edit",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(deleteDoc(guestRef));
  });

  it("rejects another user's attempts to update or delete a post", async () => {
    await createOwnedPost();
    const otherRef = doc(otherDb, "posts", "post-1");

    await assertFails(
      updateDoc(otherRef, {
        title: "Unauthorized edit",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(deleteDoc(otherRef));
  });

  it("rejects creating a post on another user's behalf", async () => {
    await assertFails(
      setDoc(doc(otherDb, "posts", "forged-post"), validPost(AUTHOR_UID)),
    );
  });

  it("rejects posts missing required fields", async () => {
    const { imageUrl: _imageUrl, ...missingImage } = validPost();
    const { description: _description, ...missingDescription } = validPost();

    await assertFails(
      setDoc(doc(authorDb, "posts", "missing-image"), missingImage),
    );
    await assertFails(
      setDoc(doc(authorDb, "posts", "missing-description"), missingDescription),
    );
  });

  it("rejects blank or overlong post content", async () => {
    await assertFails(
      setDoc(doc(authorDb, "posts", "blank-title"), {
        ...validPost(),
        title: "",
      }),
    );
    await assertFails(
      setDoc(doc(authorDb, "posts", "long-title"), {
        ...validPost(),
        title: "A".repeat(101),
      }),
    );
    await assertFails(
      setDoc(doc(authorDb, "posts", "blank-description"), {
        ...validPost(),
        description: "",
      }),
    );
    await assertFails(
      setDoc(doc(authorDb, "posts", "long-description"), {
        ...validPost(),
        description: "A".repeat(2001),
      }),
    );
    await assertFails(
      setDoc(doc(authorDb, "posts", "blank-image"), {
        ...validPost(),
        imageUrl: "",
      }),
    );
  });

  it("rejects unexpected fields and incorrect field types", async () => {
    await assertFails(
      setDoc(doc(authorDb, "posts", "extra-field"), {
        ...validPost(),
        isAdmin: true,
      }),
    );
    await assertFails(
      setDoc(doc(authorDb, "posts", "invalid-title"), {
        ...validPost(),
        title: 42,
      }),
    );
  });

  it("rejects attempts to change authorId or createdAt", async () => {
    const ref = await createOwnedPost();

    await assertFails(
      updateDoc(ref, {
        authorId: OTHER_UID,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(ref, {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("requires a server timestamp for updatedAt on update", async () => {
    const ref = await createOwnedPost();
    await assertFails(updateDoc(ref, { title: "Edit without timestamp" }));
  });

  it("rejects updates with extra fields or invalid content", async () => {
    const ref = await createOwnedPost();

    await assertFails(
      updateDoc(ref, { isAdmin: true, updatedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(ref, { title: "", updatedAt: serverTimestamp() }),
    );
  });
});
