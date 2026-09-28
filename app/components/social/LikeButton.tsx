import { useEffect, useRef, useState } from "react";
import { useAuthSession } from "../../session/AuthSessionContext";
import { getLikeState, toggleLike } from "../../services/socialService";

interface LikeButtonProps {
  postId: string;
}

export function LikeButton({ postId }: LikeButtonProps) {
  const { user } = useAuthSession();

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchState() {
      if (!user) {
        if (active) {
          setIsLiked(false);
          setLikeCount(0);
          setLoading(false);
        }
        return;
      }

      try {
        const state = await getLikeState(postId, user.uid);
        if (active) {
          setIsLiked(state.isLiked);
          setLikeCount(state.likeCount);
        }
      } catch {
        if (active) {
          setError("Failed to load likes.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    void fetchState();

    return () => {
      active = false;
    };
  }, [postId, user]);

  async function handleToggle() {
    if (!user || loading) return;

    // Optimistic UI Update
    const previousLiked = isLiked;
    const previousCount = likeCount;

    const nextLiked = !isLiked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    setIsLiked(nextLiked);
    setLikeCount(nextCount);
    setError(null);

    try {
      const serverState = await toggleLike(postId, user.uid);
      if (mountedRef.current) {
        setIsLiked(serverState.isLiked);
        setLikeCount(serverState.likeCount);
      }
    } catch {
      // Rollback on failure
      if (mountedRef.current) {
        setIsLiked(previousLiked);
        setLikeCount(previousCount);
        setError("Unable to update like.");
      }
    }
  }

  if (!user) return null;

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void handleToggle()}
        disabled={loading}
        aria-label={isLiked ? "Unlike post" : "Like post"}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
          isLiked
            ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:border-red-800"
            : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
        }`}
      >
        <span>{isLiked ? "❤️" : "🤍"}</span>
        <span>{likeCount}</span>
      </button>

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}