import {
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import {
  normalizeGeotag,
  validateGeotag,
  type Geotag,
} from "../models/geotag";

export async function attachLocationToPost(
  postId: string,
  geotag: Geotag,
): Promise<void> {
  const cleanPostId = postId.trim();

  if (!cleanPostId) {
    throw new Error("Post ID is required.");
  }

  const validation = validateGeotag(geotag);

  if (!validation.valid) {
    throw new Error("Invalid location data.");
  }

  const location = normalizeGeotag(geotag);

  await updateDoc(
    doc(db, "posts", cleanPostId),
    {
      location,
      updatedAt: serverTimestamp(),
    },
  );
}

export async function removeLocationFromPost(
  postId: string,
): Promise<void> {
  const cleanPostId = postId.trim();

  if (!cleanPostId) {
    throw new Error("Post ID is required.");
  }

  await updateDoc(
    doc(db, "posts", cleanPostId),
    {
      location: null,
      updatedAt: serverTimestamp(),
    },
  );
}
