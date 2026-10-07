import type { FeedPost } from "../../models/feed";

interface PostCardProps {
  post: FeedPost;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 overflow-hidden bg-white dark:border-gray-800 dark:bg-gray-900">
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full max-h-80 object-cover"
        />
      )}
      <div className="p-4 space-y-1.5">
        <h2 className="text-lg font-semibold">{post.title}</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {post.description}
        </p>
        <p className="text-xs text-gray-400">by {post.authorId}</p>
      </div>
    </article>
  );
}