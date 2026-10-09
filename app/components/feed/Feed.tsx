import { useEffect, useRef, useState } from "react";
import { getFirstFeedPage, getNextFeedPage } from "../../services/feedService";
import { isLastPage, type FeedPage, type FeedPost } from "../../models/feed";
import { PostCard } from "./PostCard";

type FeedStatus = "loading" | "error" | "ready";

export function Feed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [status, setStatus] = useState<FeedStatus>("loading");
  // Most recently fetched page; its nextCursor drives "Load more".
  const [lastPage, setLastPage] = useState<FeedPage | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Shown next to the control that failed: top for Refresh, bottom for Load more.
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  async function loadFirstPage() {
    setStatus("loading");
    setRefreshError(null);
    setLoadMoreError(null);
    try {
      const page = await getFirstFeedPage();
      if (!isMounted.current) return;
      setPosts(page.posts);
      setLastPage(page);
      setStatus("ready");
    } catch {
      if (isMounted.current) setStatus("error");
    }
  }

  // Refetch the first page while keeping the current posts on screen.
  async function refresh() {
    if (refreshing || loadingMore) return;

    setRefreshing(true);
    setRefreshError(null);
    try {
      const page = await getFirstFeedPage();
      if (!isMounted.current) return;
      setPosts(page.posts);
      setLastPage(page);
      setLoadMoreError(null);
    } catch {
      if (isMounted.current) {
        setRefreshError("Couldn't refresh the feed. Please try again.");
      }
    } finally {
      if (isMounted.current) setRefreshing(false);
    }
  }

  async function loadMore() {
    const cursor = lastPage?.nextCursor;
    if (cursor == null || loadingMore || refreshing) return;

    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const page = await getNextFeedPage(cursor);
      if (!isMounted.current) return;
      setPosts((prev) => [...prev, ...page.posts]);
      setLastPage(page);
    } catch {
      if (isMounted.current) {
        setLoadMoreError("Couldn't load more posts. Please try again.");
      }
    } finally {
      if (isMounted.current) setLoadingMore(false);
    }
  }

  useEffect(() => {
    void loadFirstPage();
  }, []);

  return (
    // pb-16 keeps the end of the feed clear of fixed bottom banners (e.g. the emulator warning).
    <main className="max-w-2xl mx-auto px-4 pt-6 pb-16 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feed</h1>
        <button
          type="button"
          disabled={status !== "ready" || refreshing || loadingMore}
          onClick={() => {
            void refresh();
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium disabled:opacity-50 dark:border-gray-700"
        >
          Refresh
        </button>
      </div>

      {refreshing && (
        <p role="status" className="text-sm text-gray-500">
          Refreshing...
        </p>
      )}

      {refreshError && (
        <p role="alert" className="text-sm text-red-600">
          {refreshError}
        </p>
      )}

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

      {status === "ready" && posts.length > 0 && lastPage && (
        isLastPage(lastPage) ? (
          <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-200">
            You're all caught up
          </p>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {loadMoreError && (
              <p role="alert" className="text-sm text-red-600">
                {loadMoreError}
              </p>
            )}
            <button
              type="button"
              disabled={loadingMore || refreshing}
              onClick={() => {
                void loadMore();
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-gray-700"
            >
              {loadingMore ? "Loading more..." : "Load more"}
            </button>
          </div>
        )
      )}
    </main>
  );
}
