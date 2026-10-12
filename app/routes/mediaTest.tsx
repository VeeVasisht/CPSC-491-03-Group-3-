import { useState } from "react";

import { PostMediaPicker } from "../components/PostMediaPicker";

export default function MediaTest() {
  const [imageUrl, setImageUrl] = useState("");

  return (
    <main className="min-h-screen p-8">
      <h1 className="mb-6 text-2xl font-semibold">
        Media Pipeline Test
      </h1>

      <PostMediaPicker
        onUploadComplete={setImageUrl}
      />

      {imageUrl && (
        <div className="mt-6 space-y-2">
          <h2 className="text-lg font-semibold">
            Parent received uploaded image URL
          </h2>

          <p className="break-all text-sm">
            {imageUrl}
          </p>
        </div>
      )}
    </main>
  );
}