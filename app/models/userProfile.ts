// app/models/userProfile.ts

/**
 * Shared user-profile domain model for WeTravel (P3 slice, Sprint 1).
 *
 * Pure domain logic — no Firebase imports on purpose. The UI, the profile
 * service, and the tests all share these types and rules. Timestamps are
 * epoch milliseconds; the service layer converts to/from Firestore's
 * Timestamp at the boundary, so this file never depends on the backend.
 */

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 50;
export const BIO_MAX = 160;

/**
 * A complete user profile as the app uses it.
 *
 * Note: the Firestore document at /users/{uid} does NOT store `uid` — it's
 * redundant with the document id. The service reconstructs it on read:
 *   { uid: snapshot.id, ...snapshot.data() }
 * `email` is intentionally absent — it comes from Firebase Auth and is
 * shown read-only, never part of the editable profile.
 */
export interface UserProfile {
  uid: string;        // identity — from snapshot.id, never edited
  displayName: string;
  bio: string;
  createdAt: number;  // epoch ms — immutable after creation
  updatedAt: number;  // epoch ms — refreshed on every successful save
}

/**
 * The fields a user may actually change in the Edit Profile form.
 * Derived from UserProfile so it stays in sync automatically.
 */
export type UserProfileFormValues = Pick<UserProfile, "displayName" | "bio">;

export interface FieldErrors {
  displayName?: string;
  bio?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: FieldErrors;
}

/**
 * Validate the editable profile fields. Returns a structured result so the
 * form can show a per-field message and disable Save while `valid` is false.
 */
export function validateProfileFields(
  values: UserProfileFormValues
): ValidationResult {
  const errors: FieldErrors = {};

  const name = values.displayName.trim();
  if (name.length < DISPLAY_NAME_MIN || name.length > DISPLAY_NAME_MAX) {
    errors.displayName = `Display name must be ${DISPLAY_NAME_MIN}–${DISPLAY_NAME_MAX} characters.`;
  }

  if (values.bio.trim().length > BIO_MAX) {
    errors.bio = `Bio must be ${BIO_MAX} characters or fewer.`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * True if edited fields differ from what's currently saved. Used to disable
 * Save when nothing changed (Story P3-S1-04).
 */
export function hasProfileChanges(
  current: UserProfileFormValues,
  edited: UserProfileFormValues
): boolean {
  return (
    current.displayName.trim() !== edited.displayName.trim() ||
    current.bio.trim() !== edited.bio.trim()
  );
}