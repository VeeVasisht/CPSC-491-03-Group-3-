import { useState, useEffect } from "react";

import { createPost } from "../firebase/posts";

import "../css/CreatePost.css";

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 2000;

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!image) {
      setImagePreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(image);
    setImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [image]);

  async function submitPost() {
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (!image) {
      setError("Please select an image.");
      return;
    }

    try {
      setIsSubmitting(true);

      await createPost({
        title,
        description,
        image,
      });

      setTitle("");
      setDescription("");
      setImage(null);
      setSuccess("Post created successfully.");
    } catch (error) {
      console.error("Failed to create post:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Unable to create the post. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="create-post-page">
      <section className="create-post-card">
        <h1>Create a Post</h1>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await submitPost();
          }}
        >
          <div className="form-group">
            <label htmlFor="post-title">Title</label>

            <input
              id="post-title"
              type="text"
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              disabled={isSubmitting}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Post title"
              required
            />

            <span className="character-count">
              {title.length}/{MAX_TITLE_LENGTH}
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="post-description">Description</label>

            <textarea
              id="post-description"
              value={description}
              maxLength={MAX_DESCRIPTION_LENGTH}
              rows={8}
              disabled={isSubmitting}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe your post..."
              required
            />

            <span className="character-count">
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="post-image">Image</label>

            <input
              id="post-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isSubmitting}
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              required
            />
          </div>

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Selected post preview" />
            </div>
          )}

          {error && (
            <div className="form-message error-message" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="form-message success-message" role="status">
              {success}
            </div>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating Post..." : "Create Post"}
          </button>
        </form>
      </section>
    </main>
  );
}
