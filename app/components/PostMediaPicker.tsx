import {
  useEffect,
  useState,
} from "react";

import { auth } from "../firebase/firebase";
import { uploadPostImage } from "../firebase/mediaStorage";
import { validateMedia } from "../models/media";

interface PostMediaPickerProps {
  onUploadComplete?: (url: string) => void;
}

export function PostMediaPicker({
  onUploadComplete,
}: PostMediaPickerProps) {
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [uploadedUrl, setUploadedUrl] =
    useState("");

  const [error, setError] =
    useState("");

  const [isUploading, setIsUploading] =
    useState(false);

  const [uploadFailed, setUploadFailed] =
    useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validation = validateMedia(file);

    if (!validation.valid) {
      setError(
        validation.error ?? "Invalid image.",
      );

      setSelectedFile(null);
      setPreviewUrl("");
      setUploadedUrl("");
      setUploadFailed(false);

      return;
    }

    setError("");
    setUploadedUrl("");
    setUploadFailed(false);
    setSelectedFile(file);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  async function handleUpload() {
    if (
      !selectedFile ||
      isUploading ||
      uploadedUrl
    ) {
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      setError(
        "You must be logged in before uploading an image.",
      );
      setUploadFailed(false);
      return;
    }

    setError("");
    setUploadedUrl("");
    setUploadFailed(false);
    setIsUploading(true);

    try {
      const url = await uploadPostImage(
        selectedFile,
        user.uid,
      );

      setUploadedUrl(url);

      onUploadComplete?.(url);
    } catch (error) {
      console.error(
        "Media upload failed:",
        error,
      );

      setUploadFailed(true);

      setError(
        "Image upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <label
        htmlFor="post-image"
        className="block font-medium"
      >
        Select Image
      </label>

      <input
        id="post-image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {error && (
        <p
          role="alert"
          className="text-red-600"
        >
          {error}
        </p>
      )}

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Selected post preview"
          className="max-h-64 max-w-sm rounded-lg object-contain"
        />
      )}

      {selectedFile && (
        <p>
          Selected: {selectedFile.name}
        </p>
      )}

      {selectedFile && !uploadFailed && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={
            isUploading ||
            Boolean(uploadedUrl)
          }
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {isUploading
            ? "Uploading..."
            : uploadedUrl
              ? "Uploaded"
              : "Upload Image"}
        </button>
      )}

      {uploadFailed && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          {isUploading
            ? "Retrying..."
            : "Retry Upload"}
        </button>
      )}

      {uploadedUrl && (
        <div className="space-y-2">
          <p className="font-medium text-green-600">
            Upload successful.
          </p>

          <p className="break-all text-sm">
            {uploadedUrl}
          </p>
        </div>
      )}
    </div>
  );
}