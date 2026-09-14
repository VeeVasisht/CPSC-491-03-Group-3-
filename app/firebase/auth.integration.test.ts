import { beforeAll, describe, expect, it } from "vitest";

import {
  connectAuthEmulator,
} from "firebase/auth";

import {
  connectFirestoreEmulator,
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";
import { createAccount } from "./auth";

beforeAll(() => {
  connectAuthEmulator(
    auth,
    "http://127.0.0.1:9099",
    { disableWarnings: true }
  );

  connectFirestoreEmulator(
    db,
    "127.0.0.1",
    8080
  );
});

describe("registration integration", () => {
  it("creates an Auth user and Firestore profile", async () => {
    const email = `test-${Date.now()}@example.com`;

    const credential = await createAccount(
      email,
      "password123",
      "Robert"
    );

    expect(credential.user.uid).toBeDefined();

    const snapshot = await getDoc(
      doc(db, "users", credential.user.uid)
    );

    expect(snapshot.exists()).toBe(true);

    expect(snapshot.data()).toMatchObject({
      displayName: "Robert",
      bio: "",
    });
  });
});