// @vitest-environment node
// Run with: firebase emulators:exec --only firestore "npx vitest run app/firebase/post.validation.integration.test.ts"
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

// These tests use the actual Firestore rules, never a production database.
const PROJECT_ID = "demo-wetravel-post-validation-tests";
const AUTHOR_UID = "post-validation-author";

let testEnv: RulesTestEnvironment;
type TestFirestore = ReturnType<
  ReturnType<RulesTestEnvironment["authenticatedContext"]>["firestore"]
>;
let authorDb: TestFirestore;

function validPost() {
  return {
    authorId: AUTHOR_UID,
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
      'FIRESTORE_EMULATOR_HOST is not set. Run: firebase emulators:exec --only firestore "npx vitest run app/firebase/post.validation.integration.test.ts"',
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
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv?.cleanup();
});

describe("Post Firestore validation (SCRUM-270 regression tests)", () => {
  it("rejects whitespace-only titles and descriptions on create", async () => {
    for (const [field, value] of [
      ["title", "   "],
      ["description", "  \t  "],
    ] as const) {
      await assertFails(
        setDoc(doc(authorDb, "posts", `blank-${field}`), {
          ...validPost(),
          [field]: value,
        }),
      );
    }
  });

  it("rejects whitespace-only titles and descriptions on update", async () => {
    const ref = await createOwnedPost();
    await assertFails(
      updateDoc(ref, { title: "   ", updatedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(ref, {
        description: "  \t  ",
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("rejects non-HTTPS and whitespace-containing image URLs on create", async () => {
    const invalidUrls = [
      "http://example.com/photo.jpg",
      "ftp://example.com/photo.jpg",
      "not-a-url",
      "https://example.com/photo name.jpg",
      "https://example.com/photo\tname.jpg",
    ];
    for (const [index, imageUrl] of invalidUrls.entries()) {
      await assertFails(
        setDoc(doc(authorDb, "posts", `invalid-url-${index}`), {
          ...validPost(),
          imageUrl,
        }),
      );
    }
  });

  it("rejects non-HTTPS and whitespace-containing image URLs on update", async () => {
    const ref = await createOwnedPost();
    for (const imageUrl of [
      "http://example.com/photo.jpg",
      "not-a-url",
      "https://example.com/photo name.jpg",
    ]) {
      await assertFails(
        updateDoc(ref, { imageUrl, updatedAt: serverTimestamp() }),
      );
    }
  });

  it("enforces the 2048-character image URL limit on create and update", async () => {
    const prefix = "https://example.com/";
    const maxLengthUrl = prefix + "a".repeat(2048 - prefix.length);
    const oversizedUrl = maxLengthUrl + "a";

    await assertFails(
      setDoc(doc(authorDb, "posts", "oversized"), {
        ...validPost(),
        imageUrl: oversizedUrl,
      }),
    );

    const ref = doc(authorDb, "posts", "max-length");
    await assertSucceeds(setDoc(ref, { ...validPost(), imageUrl: maxLengthUrl }));
    await assertFails(
      updateDoc(ref, { imageUrl: oversizedUrl, updatedAt: serverTimestamp() }),
    );
  });

  it("allows valid post content and HTTPS image URLs on create and update", async () => {
    const ref = await createOwnedPost("valid-post");
    await assertSucceeds(
      updateDoc(ref, {
        title: "Updated Japan Vacation",
        description: "Updated description",
        imageUrl: "https://example.com/updated.jpg",
        updatedAt: serverTimestamp(),
      }),
    );
  });
});
