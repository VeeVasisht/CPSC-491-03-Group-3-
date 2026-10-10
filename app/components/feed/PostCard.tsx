import type { FeedPost } from "../../models/feed";
import { PostLocation } from "../location/PostLocation";

interface PostCardProps {
  post: FeedPost;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

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
        <PostLocation location={post.location} />
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {post.description}
        </p>
        <p className="text-xs text-gray-400">
          by {post.authorId} ·{" "}
          <time dateTime={new Date(post.createdAt).toISOString()}>
            {dateFormatter.format(post.createdAt)}
          </time>
        </p>
      </div>
    </article>
  );
}
