import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import {
  validateCommentInput,
  type Comment,
  type CreateCommentInput,
} from "../models/comment";
import type { LikeState } from "../models/like";

/**
 * Checks if a specific user has liked a post and returns the current like status.
 */
export async function getLikeState(
  postId: string,
  userId: string,
): Promise<LikeState> {
  if (!postId.trim() || !userId.trim()) {
    return { isLiked: false, likeCount: 0 };
  }

  const postRef = doc(db, "posts", postId.trim());
  const likeRef = doc(db, "posts", postId.trim(), "likes", userId.trim());

  const [postSnap, likeSnap] = await Promise.all([
    getDoc(postRef),
    getDoc(likeRef),
  ]);

  const likeCount = postSnap.exists() ? (postSnap.data().likeCount ?? 0) : 0;
  const isLiked = likeSnap.exists();

  return { isLiked, likeCount };
}

/**
 * Toggles like/unlike using an atomic Firestore transaction to maintain exact counts.
 */
export async function toggleLike(
  postId: string,
  userId: string,
): Promise<LikeState> {
  const cleanPostId = postId.trim();
  const cleanUserId = userId.trim();

  if (!cleanPostId || !cleanUserId) {
    throw new Error("Post ID and User ID are required.");
  }

  const postRef = doc(db, "posts", cleanPostId);
  const likeRef = doc(db, "posts", cleanPostId, "likes", cleanUserId);

  return runTransaction(db, async (transaction) => {
    const postSnap = await transaction.get(postRef);
    if (!postSnap.exists()) {
      throw new Error("Post does not exist.");
    }

    const likeSnap = await transaction.get(likeRef);
    const currentCount = postSnap.data().likeCount ?? 0;

    if (likeSnap.exists()) {
      const newCount = Math.max(0, currentCount - 1);
      transaction.delete(likeRef);
      transaction.update(postRef, {
        likeCount: newCount,
        updatedAt: serverTimestamp(),
      });
      return { isLiked: false, likeCount: newCount };
    } else {
      const newCount = currentCount + 1;
      transaction.set(likeRef, {
        userId: cleanUserId,
        likedAt: serverTimestamp(),
      });
      transaction.update(postRef, {
        likeCount: newCount,
        updatedAt: serverTimestamp(),
      });
      return { isLiked: true, likeCount: newCount };
    }
  });
}

/**
 * Retrieves comments for a given post ordered chronologically.
 */
export async function getPostComments(postId: string): Promise<Comment[]> {
  const cleanPostId = postId.trim();
  if (!cleanPostId) {
    return [];
  }

  const commentsRef = collection(db, "posts", cleanPostId, "comments");
  const q = query(commentsRef, orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      postId: cleanPostId,
      userId: data.userId ?? "",
      authorName: data.authorName ?? "Anonymous",
      content: data.content ?? "",
      createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
    };
  });
}

/**
 * Adds a comment to a post and updates comment counts.
 */
export async function addComment(input: CreateCommentInput): Promise<Comment> {
  const cleanPostId = input.postId.trim();
  const cleanUserId = input.userId.trim();

  if (!cleanPostId || !cleanUserId) {
    throw new Error("Post ID and User ID are required.");
  }

  const validation = validateCommentInput(input.content);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const commentsRef = collection(db, "posts", cleanPostId, "comments");
  const postRef = doc(db, "posts", cleanPostId);

  const newDoc = await addDoc(commentsRef, {
    postId: cleanPostId,
    userId: cleanUserId,
    authorName: input.authorName.trim() || "Anonymous",
    content: input.content.trim(),
    createdAt: serverTimestamp(),
  });

  return {
    id: newDoc.id,
    postId: cleanPostId,
    userId: cleanUserId,
    authorName: input.authorName.trim() || "Anonymous",
    content: input.content.trim(),
    createdAt: Date.now(),
  };
}