import { useEffect, useState } from "react";
import { getFirstFeedPage } from "../../services/feedService";
import type { FeedPost } from "../../models/feed";
import { PostCard } from "./PostCard";

export function Feed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const page = await getFirstFeedPage();
        if (active) setPosts(page.posts);
      } catch {
        // states (loading/empty/error) handled in SCRUM-55
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Feed</h1>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </main>
  );
}