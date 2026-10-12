import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { PostLocation } from "../components/location/PostLocation";
import type { FeedPost } from "../models/feed";
import { getMapPostById } from "../services/mapPostService";

type LoadState = "loading" | "ready" | "not-found" | "error";

/** Minimal detail destination for map previews; does not modify the feed. */
export function PostDetail() {
  const { postId } = useParams();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [status, setStatus] = useState<LoadState>("loading");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setPost(null);
    void (async () => {
      try {
        const result = await getMapPostById(postId ?? "");
        if (!active) return;
        setPost(result);
        setStatus(result ? "ready" : "not-found");
      } catch {
        if (active) setStatus("error");
      }
    })();
    return () => { active = false; };
  }, [postId, retryCount]);

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <Link to={postId ? `/map?postId=${encodeURIComponent(postId)}` : "/map"} className="text-blue-700 hover:underline">← Back to map</Link>
      {status === "loading" && <p role="status">Loading post...</p>}
      {status === "not-found" && <p role="alert">Post not found.</p>}
      {status === "error" && (
        <div role="alert">
          <p>Unable to load the post.</p>
          <button type="button" onClick={() => setRetryCount((n) => n + 1)}>
            Retry
          </button>
        </div>
      )}
      {status === "ready" && post && (
        <article className="space-y-3">
          <h1 className="text-2xl font-bold">{post.title}</h1>
          {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="w-full rounded-lg" />}
          <PostLocation location={post.location} />
          <p className="whitespace-pre-wrap">{post.description}</p>
          {post.location && (
            <Link
              to={`/map?postId=${encodeURIComponent(post.id)}`}
              className="inline-block text-blue-700 hover:underline"
            >
              Show location on map
            </Link>
          )}
        </article>
      )}
    </main>
  );
}
