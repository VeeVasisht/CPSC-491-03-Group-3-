import {
    collection,
    doc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytes,
} from "firebase/storage";

import { auth, db, storage } from "./firebase";
import type { CreatePostData } from "../models/post";

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

export function validatePost(data: CreatePostData): void {
    const title = data.title.trim();
    const description = data.description.trim();

    if (!title) {
        throw new Error("A title is required.");
    }

    if (title.length > MAX_TITLE_LENGTH) {
        throw new Error(
            `Title cannot exceed ${MAX_TITLE_LENGTH} characters.`,
        );
    }

    if (!description) {
        throw new Error("A description is required.");
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(
            `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
        );
    }

    if (!data.image) {
        throw new Error("An image is required.");
    }

    if (!ALLOWED_IMAGE_TYPES.includes(data.image.type)) {
        throw new Error(
            "Image must be a JPEG, PNG, or WebP file.",
        );
    }

    if (data.image.size > MAX_IMAGE_SIZE) {
        throw new Error("Image cannot be larger than 5 MB.");
    }
}

export async function createPost(
    data: CreatePostData,
): Promise<string> {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("You must be logged in to create a post.");
    }

    validatePost(data);

    // Generates an ID without writing a document.
    const postRef = doc(collection(db, "posts"));

    const extension =
        data.image.name.split(".").pop()?.toLowerCase() ?? "jpg";

    const imageRef = ref(
        storage,
        `posts/${user.uid}/${postRef.id}.${extension}`,
    );

    try {
        // Upload the image first.
        await uploadBytes(imageRef, data.image);

        // Get the completed Storage URL.
        const imageUrl = await getDownloadURL(imageRef);

        // Now write the complete post.
        await setDoc(postRef, {
            authorId: user.uid,
            title: data.title.trim(),
            description: data.description.trim(),
            imageUrl,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return postRef.id;
    } catch (error) {
        // If Firestore creation fails after the upload,
        // clean up the orphaned Storage file.
        await deleteObject(imageRef).catch(() => {});

        throw error;
    }
}