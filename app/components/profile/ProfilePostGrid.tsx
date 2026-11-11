import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { X } from "lucide-react";
import type { FeedPost } from "../../models/feed";

type ProfilePostGridProps = {
  posts: FeedPost[];
  /** Display name of the profile owner, shown above each post's caption. */
  authorName: string;
};

/**
 * Instagram-style grid of a user's posts: square photo tiles, three across.
 * Posts without a photo show their title on a plain tile instead.
 * Clicking a tile opens the post with its full photo and caption.
 */
export function ProfilePostGrid({ posts, authorName }: ProfilePostGridProps) {
  const [openPost, setOpenPost] = useState<FeedPost | null>(null);
  // The tile that opened the viewer, so focus can go back to it on close.
  const openerRef = useRef<HTMLButtonElement | null>(null);

  function closeViewer() {
    setOpenPost(null);
    openerRef.current?.focus();
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white">No posts yet</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Posts you share will show up here.
        </p>
        <Link
          to="/createPost"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Create a post
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul aria-label="Your posts" className="grid grid-cols-3 gap-1 sm:gap-2">
        {posts.map((post) => (
          <li key={post.id} className="aspect-square">
            <button
              type="button"
              aria-label={`Open post: ${post.title || "Untitled post"}`}
              onClick={(e) => {
                openerRef.current = e.currentTarget;
                setOpenPost(post);
              }}
              className="group relative block h-full w-full overflow-hidden rounded-md bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-gray-800"
            >
              {post.imageUrl ? (
                <img
                  src={post.imageUrl}
                  alt={post.title || "Travel post"}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center p-3 text-center">
                  <span className="line-clamp-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {post.title || "Untitled post"}
                  </span>
                </span>
              )}

              {post.imageUrl && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="block truncate text-xs font-semibold text-white">
                    {post.title}
                  </span>
                  {post.location && (
                    <span className="block truncate text-xs text-white/80">
                      📍 {post.location.name}
                    </span>
                  )}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {openPost && (
        <PostViewer post={openPost} authorName={authorName} onClose={closeViewer} />
      )}
    </>
  );
}

type PostViewerProps = {
  post: FeedPost;
  authorName: string;
  onClose: () => void;
};

/**
 * Full view of one post, laid out like an Instagram post: the photo on top,
 * then the author, the caption and the date underneath.
 * Closes with the X button, Escape, or a click outside.
 */
function PostViewer({ post, authorName, onClose }: PostViewerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);

    // Stop the page behind from scrolling while the post is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const postedOn = new Date(post.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const initial = authorName.trim().charAt(0).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-viewer-title"
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900"
      >
        {post.imageUrl && (
          <div className="flex min-h-0 shrink items-center justify-center bg-black">
            <img
              src={post.imageUrl}
              alt={post.title || "Travel post"}
              className="max-h-[65vh] w-full object-contain"
            />
          </div>
        )}

        <div className="overflow-y-auto p-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            >
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {authorName}
              </p>
              {post.location && (
                <p className="truncate text-xs text-gray-600 dark:text-gray-400">
                  {post.location.name}
                </p>
              )}
            </div>
          </div>

          <h3
            id="post-viewer-title"
            className="mt-3 text-base font-semibold text-gray-900 dark:text-white"
          >
            {post.title || "Untitled post"}
          </h3>
          {post.description && (
            <p className="mt-1 whitespace-pre-line text-sm text-gray-800 dark:text-gray-200">
              <span className="font-semibold text-gray-900 dark:text-white">{authorName}</span>{" "}
              {post.description}
            </p>
          )}
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{postedOn}</p>
        </div>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close post"
          className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
