// app/services/profileService.ts

/**
 * Profile service (P3 slice, Sprint 1).
 *
 * Reads and writes the current authenticated user's profile in Firestore.
 * The UI never talks to Firestore directly — it goes through here. The uid
 * always comes from the auth session, never passed in from a screen, so a
 * user can only ever act on their own profile.
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import type { UserProfile, UserProfileFormValues } from "../models/userProfile";

/**
 * Result type so callers can handle every outcome without try/catch
 * everywhere. `status` tells the UI which state to render.
 */
export type ProfileResult =
  | { status: "ok"; profile: UserProfile }
  | { status: "not-found" }
  | { status: "error"; message: string };

export type UpdateResult =
  | { status: "ok" }
  | { status: "error"; message: string };

/**
 * Read the signed-in user's profile from users/{uid}.
 * uid is rebuilt from the document id (snapshot.id) — it's not stored in
 * the document itself, matching the UserProfile model.
 */
export async function getCurrentProfile(): Promise<ProfileResult> {
  const user = auth.currentUser;
  if (!user) {
    return { status: "error", message: "You must be signed in to view your profile." };
  }

  try {
    const snapshot = await getDoc(doc(db, "users", user.uid));

    if (!snapshot.exists()) {
      return { status: "not-found" };
    }

    const data = snapshot.data();
    const profile: UserProfile = {
      uid: snapshot.id, // identity comes from the doc id, not the stored data
      displayName: data.displayName,
      bio: data.bio ?? "",
      // Firestore Timestamps → epoch ms, so the app model stays backend-free
      createdAt: data.createdAt?.toMillis?.() ?? 0,
      updatedAt: data.updatedAt?.toMillis?.() ?? 0,
    };

    return { status: "ok", profile };
  } catch {
    return { status: "error", message: "Couldn't load your profile. Please try again." };
  }
}

/**
 * Update the signed-in user's displayName and bio. updatedAt is set with
 * serverTimestamp() — the security rules require updatedAt == request.time,
 * so a client-set timestamp would be rejected.
 */
export async function updateCurrentProfile(
  values: UserProfileFormValues
): Promise<UpdateResult> {
  const user = auth.currentUser;
  if (!user) {
    return { status: "error", message: "You must be signed in to edit your profile." };
  }

  try {
    await updateDoc(doc(db, "users", user.uid), {
      displayName: values.displayName.trim(),
      bio: values.bio.trim(),
      updatedAt: serverTimestamp(),
    });
    return { status: "ok" };
  } catch {
    return { status: "error", message: "Couldn't save your changes. Please try again." };
  }
}

/**
 * Create the initial profile document for a new user. Normally P1's
 * registration does this, but it's here so the profile flow is testable
 * end-to-end. Both timestamps use serverTimestamp() to satisfy the
 * create rule (createdAt == updatedAt == request.time).
 */
export async function createInitialProfile(
  values: UserProfileFormValues
): Promise<UpdateResult> {
  const user = auth.currentUser;
  if (!user) {
    return { status: "error", message: "You must be signed in to create a profile." };
  }

  try {
    await setDoc(doc(db, "users", user.uid), {
      displayName: values.displayName.trim(),
      bio: values.bio.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { status: "ok" };
  } catch {
    return { status: "error", message: "Couldn't create your profile. Please try again." };
  }
}