import { useState } from "react";
import { getLocationFeed } from "../services/locationFeedService";
import type { LocationFeedPost } from "../models/locationFeed";

export function LocationFeed() {
  const [region, setRegion] = useState("");
  const [posts, setPosts] = useState<LocationFeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!region.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const results = await getLocationFeed({ regionName: region });
      setPosts(results);
    } catch {
      setError("Unable to load region posts. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="border-b pb-4 dark:border-gray-700">
        <h1 className="text-3xl font-bold">Location-Based Feed</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Discover posts and travel memories by map region or city.
        </p>
      </header>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="Enter city or region (e.g. Irvine, CA)..."
          className="flex-1 rounded-xl border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-800"
        />
        <button
          type="submit"
          disabled={loading || !region.trim()}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search Region"}
        </button>
      </form>

      {error && (
        <div role="alert" className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Searching location feed...</p>
      ) : searched && posts.length === 0 ? (
        <div className="p-6 text-center border rounded-2xl dark:border-gray-800">
          <p className="text-gray-500">No travel posts found for "{region}".</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <article key={post.id} className="border rounded-2xl p-4 dark:border-gray-800 space-y-3">
              <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover rounded-xl" />
              <h2 className="text-xl font-bold">{post.title}</h2>
              <p className="text-sm text-gray-500">📍 {post.location.name}</p>
              <p className="text-gray-700 dark:text-gray-300">{post.description}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}