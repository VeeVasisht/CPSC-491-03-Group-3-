import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { storage } from "./firebase";

export async function uploadPostImage(
  file: File,
  userId: string,
): Promise<string> {
  const uniqueId = crypto.randomUUID();

  const safeFileName = file.name.replace(
    /[^a-zA-Z0-9._-]/g,
    "_",
  );

  const storagePath =
    `post-images/${userId}/${uniqueId}-${safeFileName}`;

  const imageRef = ref(
    storage,
    storagePath,
  );

  const snapshot = await uploadBytes(
    imageRef,
    file,
    {
      contentType: file.type,
    },
  );

  return getDownloadURL(snapshot.ref);
}