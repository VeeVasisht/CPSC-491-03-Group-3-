import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

function validateIds(
  userId: string,
  postId: string,
): void {
  if (!userId.trim()) {
    throw new Error("User ID is required.");
  }

  if (!postId.trim()) {
    throw new Error("Post ID is required.");
  }
}

export async function savePost(
  userId: string,
  postId: string,
): Promise<void> {
  validateIds(userId, postId);

  const savedPostRef = doc(
    db,
    "users",
    userId.trim(),
    "savedPosts",
    postId.trim(),
  );

  await setDoc(savedPostRef, {
    postId: postId.trim(),
    savedAt: serverTimestamp(),
  });
}

export async function unsavePost(
  userId: string,
  postId: string,
): Promise<void> {
  validateIds(userId, postId);

  await deleteDoc(
    doc(
      db,
      "users",
      userId.trim(),
      "savedPosts",
      postId.trim(),
    ),
  );
}

export async function isPostSaved(
  userId: string,
  postId: string,
): Promise<boolean> {
  if (!userId.trim() || !postId.trim()) {
    return false;
  }

  const snapshot = await getDoc(
    doc(
      db,
      "users",
      userId.trim(),
      "savedPosts",
      postId.trim(),
    ),
  );

  return snapshot.exists();
}
