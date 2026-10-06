import { useEffect, useRef, useState } from "react";
import { useAuthSession } from "../../session/AuthSessionContext";
import { addComment, getPostComments } from "../../services/socialService";
import { validateCommentInput, type Comment } from "../../models/comment";

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuthSession();

  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const list = await getPostComments(postId);
        if (active) setComments(list);
      } catch {
        if (active) setError("Could not load comments.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [postId]);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!user || submitting) return;

    const validation = validateCommentInput(content);
    if (!validation.valid) {
      setError(validation.error ?? "Invalid comment.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const newComment = await addComment({
        postId,
        userId: user.uid,
        authorName: user.displayName || user.email || "User",
        content,
      });

      setComments((prev) => [...prev, newComment]);
      setContent("");

      setTimeout(scrollToBottom, 100);
    } catch {
      setError("Failed to post comment. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <section className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
      <h3 className="text-md font-semibold">Comments ({comments.length})</h3>

      {loading ? (
        <p className="text-sm text-gray-500">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet. Be the first!</p>
      ) : (
        <ul className="space-y-3 max-h-60 overflow-y-auto">
          {comments.map((c) => (
            <li key={c.id} className="text-sm rounded-lg bg-gray-50 dark:bg-gray-800 p-2.5">
              <span className="font-semibold block">{c.authorName}</span>
              <p className="text-gray-700 dark:text-gray-300">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment..."
            rows={2}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </form>
      ) : (
        <p className="text-xs text-gray-500">Log in to leave a comment.</p>
      )}
    </section>
  );
}