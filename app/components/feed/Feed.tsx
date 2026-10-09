import { useEffect, useRef, useState } from "react";
import { getFirstFeedPage } from "../../services/feedService";
import type { FeedPost } from "../../models/feed";
import { PostCard } from "./PostCard";

type FeedStatus = "loading" | "error" | "ready";

export function Feed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [status, setStatus] = useState<FeedStatus>("loading");
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  async function loadFirstPage() {
    setStatus("loading");
    try {
      const page = await getFirstFeedPage();
      if (!isMounted.current) return;
      setPosts(page.posts);
      setStatus("ready");
    } catch {
      if (isMounted.current) setStatus("error");
    }
  }

  useEffect(() => {
    void loadFirstPage();
  }, []);

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Feed</h1>

      {status === "loading" && (
        <p role="status" className="text-sm text-gray-500">
          Loading posts...
        </p>
      )}

      {status === "error" && (
        <div role="alert" className="space-y-2">
          <p className="text-sm text-red-600">
            Couldn't load the feed. Please try again.
          </p>
          <button
            type="button"
            onClick={() => {
              void loadFirstPage();
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium dark:border-gray-700"
          >
            Retry
          </button>
        </div>
      )}

      {status === "ready" && posts.length === 0 && (
        <p className="text-sm text-gray-500">
          No posts yet. Check back soon!
        </p>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </main>
  );
}
