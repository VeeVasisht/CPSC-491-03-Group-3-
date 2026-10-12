import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../css/Map.css";
import { useEffect, useState } from "react";
import { PostMarkers } from "./PostMarkers";
import { getMapPosts } from "../services/mapPostService";
import { toPostMarkers, type PostMarker } from "../models/postMarker";
import L from "leaflet";

const DEFAULT_CENTER: [number, number] = [34.0522, -118.2437];

type Coordinates = [number, number];

function UserLocation({ autoCenter = true }: { autoCenter?: boolean }) {
  const map = useMap();

  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Coordinates = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        setUserLocation(location);
        if (autoCenter) map.setView(location, 14);
      },
      (error) => {
        console.warn("Unable to get user's location:", error.message);
      },
    );
  }, [map, autoCenter]);

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    const RecenterControl = L.Control.extend({
      options: {
        position: "bottomright",
      },

      onAdd() {
        const button = L.DomUtil.create("button", "recenter-button");

        button.type = "button";
        button.title = "Recenter on my location";
        button.setAttribute("aria-label", "Recenter map on my location");

        button.innerHTML = "◎";

        L.DomEvent.disableClickPropagation(button);

        L.DomEvent.on(button, "click", () => {
          map.setView(userLocation, 14);
        });

        return button;
      },
    });

    const control = new RecenterControl();
    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [map, userLocation]);

  if (!userLocation) {
    return null;
  }

  return (
    <CircleMarker
      center={userLocation}
      radius={9}
      pathOptions={{
        fillColor: "#4285f4",
        fillOpacity: 1,
        color: "white",
        weight: 3,
      }}
    >
      <Popup>You are here</Popup>
    </CircleMarker>
  );
}

type MapLoadState = "loading" | "ready" | "error";

function FocusOnPost({ post }: { post: PostMarker }) {
  const map = useMap();
  useEffect(() => {
    map.setView([post.location.latitude, post.location.longitude], 14);
  }, [map, post.id, post.location.latitude, post.location.longitude]);
  return null;
}

export function BaseMap({
  focusPostId = null,
  onPostSelect,
}: {
  focusPostId?: string | null;
  onPostSelect?: (postId: string) => void;
}) {
  const [markers, setMarkers] = useState<PostMarker[]>([]);
  const [status, setStatus] = useState<MapLoadState>("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string>("");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    void (async () => {
      try {
        const posts = await getMapPosts();
        if (!active) return;
        setMarkers(toPostMarkers(posts));
        setStatus("ready");
      } catch {
        if (active) setStatus("error");
      }
    })();
    return () => { active = false; };
  }, [reloadKey]);

  const selectedPostId = selectedMarkerId || focusPostId;
  const selectedPost = selectedPostId
    ? markers.find((marker) => marker.id === selectedPostId)
    : undefined;

  return (
    <main className="map-page">
      <div className="map-header">
        <h1>Map</h1>
        <p>Explore posts near you.</p>
        {status === "loading" && <p role="status">Loading post markers...</p>}
        {status === "error" && (
          <div role="alert">
            <p>Unable to load post markers. Please try again.</p>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
              Retry
            </button>
          </div>
        )}
        {status === "ready" && markers.length === 0 && (
          <p role="status">No geotagged posts to show yet.</p>
        )}
        {status === "ready" && markers.length > 0 && (
          <label className="map-post-picker">
            Find a post on the map
            <select
              aria-label="Find a post on the map"
              value={selectedMarkerId || focusPostId || ""}
              onChange={(event) => setSelectedMarkerId(event.target.value)}
            >
              <option value="">Choose a post...</option>
              {markers.map((marker) => (
                <option key={marker.id} value={marker.id}>
                  {marker.title} — {marker.location.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {status === "ready" && focusPostId && !selectedPost && (
          <p role="status">That post has no available map location.</p>
        )}
      </div>

      <div className="map-container">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={11}
          scrollWheelZoom
          className="leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              tileerror: (error) => {
                console.error("Map tile failed to load:", error);
              },
            }}
          />
          <UserLocation autoCenter={!selectedPostId} />
          <PostMarkers posts={markers} onSelect={onPostSelect} />
          {selectedPost && <FocusOnPost post={selectedPost} />}
        </MapContainer>
      </div>
    </main>
  );
}
