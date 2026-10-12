import { Link } from "react-router";
import { CircleMarker, Popup } from "react-leaflet";
import type { PostMarker } from "../models/postMarker";

interface PostMarkersProps {
  posts: readonly PostMarker[];
  onSelect?: (postId: string) => void;
}

/** Layer on the existing Leaflet map; does not create another map instance. */
export function PostMarkers({ posts, onSelect }: PostMarkersProps) {
  return (
    <>
      {posts.map((post) => (
        <CircleMarker
          key={post.id}
          center={[post.location.latitude, post.location.longitude]}
          radius={10}
          eventHandlers={{ click: () => onSelect?.(post.id) }}
          pathOptions={{ color: "#9a3412", fillColor: "#f97316", fillOpacity: 0.85, weight: 2 }}
        >
          <Popup>
            <article className="post-marker-preview" aria-label={`Preview: ${post.title}`}>
              {post.imageUrl && (
                <img src={post.imageUrl} alt="" loading="lazy" />
              )}
              <h2>{post.title}</h2>
              <p className="post-marker-place">{post.location.name}</p>
              {post.description && (
                <p>{post.description.length > 160
                  ? `${post.description.slice(0, 157)}...`
                  : post.description}</p>
              )}
              <Link to={`/posts/${encodeURIComponent(post.id)}`}>
                View post
              </Link>
            </article>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}
