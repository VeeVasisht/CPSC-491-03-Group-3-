import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  deleteUser,
} from "firebase/auth";

import type { UserCredential } from "firebase/auth";

/**
 * Creates a Firebase Auth account and the matching Firestore user profile.
 *
 * Firestore path:
 *   /users/{uid}
 *
 * The uid is NOT duplicated inside the Firestore document.
 * Email/password remain managed by Firebase Auth.
 */
export async function createAccount(
  email: string,
  password: string,
  displayName: string,
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );

  try {
    await setDoc(doc(db, "users", credential.user.uid), {
      displayName: displayName.trim(),
      bio: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return credential;
  } catch (error) {
    // Prevent an Auth-only account if the initial Firestore profile write fails.
    try {
      await deleteUser(credential.user);
    } catch {
      // If rollback fails, preserve the original Firestore error.
    }

    throw error;
  }
}

/**
 * Signs an existing user into Firebase Auth.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

/**
 * Signs the currently authenticated user out.
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Sends a Firebase password-reset email.
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}
