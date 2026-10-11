import {
  collection,
  documentId,
  getDocsFromServer,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

/** Shown when an author's users/{uid} doc or displayName is missing. */
export const UNKNOWN_AUTHOR = "Unknown traveler";

/** Firestore's maximum number of values in an `in` filter. */
export const AUTHOR_LOOKUP_CHUNK_SIZE = 30;

/**
 * Look up display names for a set of author uids in as few reads as possible.
 *
 * Ids are de-duplicated, then fetched from users/{uid} with one
 * `documentId() in [...]` query per chunk of AUTHOR_LOOKUP_CHUNK_SIZE.
 * Uses getDocsFromServer (like the feed) so an unreachable server rejects
 * instead of silently returning stale cached names.
 *
 * The returned map only contains authors that have a non-blank displayName;
 * callers fall back to UNKNOWN_AUTHOR for anything else.
 */
export async function getAuthorNames(
  authorIds: string[],
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(authorIds.filter((id) => id))];
  const names = new Map<string, string>();
  if (uniqueIds.length === 0) return names;

  const chunks: string[][] = [];
  for (let i = 0; i < uniqueIds.length; i += AUTHOR_LOOKUP_CHUNK_SIZE) {
    chunks.push(uniqueIds.slice(i, i + AUTHOR_LOOKUP_CHUNK_SIZE));
  }

  const usersRef = collection(db, "users");
  const snapshots = await Promise.all(
    chunks.map((ids) =>
      getDocsFromServer(query(usersRef, where(documentId(), "in", ids))),
    ),
  );

  for (const snapshot of snapshots) {
    for (const docSnap of snapshot.docs) {
      const displayName = docSnap.data().displayName;
      if (typeof displayName === "string" && displayName.trim()) {
        names.set(docSnap.id, displayName.trim());
      }
    }
  }

  return names;
}
