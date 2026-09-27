import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuthSession } from "../../session/AuthSessionContext";

import {
  isPostSaved,
  savePost,
  unsavePost,
} from "../../services/savedPostService";

interface SavePostButtonProps {
  postId: string;
}

export function SavePostButton({
  postId,
}: SavePostButtonProps) {
  const { user } = useAuthSession();

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSavedState() {
      if (!user) {
        if (active && isMounted.current) {
          setSaved(false);
          setLoading(false);
        }

        return;
      }

      try {
        const result = await isPostSaved(
          user.uid,
          postId,
        );

        if (active && isMounted.current) {
          setSaved(result);
        }
      } catch {
        if (active && isMounted.current) {
          setError(
            "Unable to check saved post.",
          );
        }
      } finally {
        if (active && isMounted.current) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    setError(null);

    void loadSavedState();

    return () => {
      active = false;
    };
  }, [user, postId]);

  async function handleSaveToggle() {
    if (!user || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (saved) {
        await unsavePost(
          user.uid,
          postId,
        );

        if (isMounted.current) {
          setSaved(false);
        }
      } else {
        await savePost(
          user.uid,
          postId,
        );

        if (isMounted.current) {
          setSaved(true);
        }
      }
    } catch {
      if (isMounted.current) {
        setError(
          saved
            ? "Unable to remove saved post."
            : "Unable to save post.",
        );
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => {
          void handleSaveToggle();
        }}
        disabled={loading}
        aria-pressed={saved}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium disabled:opacity-50 dark:border-gray-700"
      >
        {loading
          ? "Loading..."
          : saved
            ? "Saved"
            : "Save"}
      </button>

      {error && (
        <p
          role="alert"
          className="text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
