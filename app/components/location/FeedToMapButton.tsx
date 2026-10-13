import { useState } from "react";
import { useNavigate } from "react-router";

import type { Geotag } from "../../models/geotag";

import {
  buildMapUrl,
  canOpenLocationOnMap,
} from "../../services/feedToMapService";

interface FeedToMapButtonProps {
  location?: Geotag | null;
  className?: string;
}

export function FeedToMapButton({
  location,
  className,
}: FeedToMapButtonProps) {
  const navigate = useNavigate();

  const [error, setError] = useState("");

  const canOpenMap = canOpenLocationOnMap(location);

  function openMap() {
    setError("");

    try {
      const mapUrl = buildMapUrl(location);
      navigate(mapUrl);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Unable to open this location on the map.");
      }
    }
  }

  if (!location) {
    return null;
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={openMap}
        disabled={!canOpenMap}
        aria-label={`Open ${location.name || "post location"} on map`}
      >
        View on Map
      </button>

      {!canOpenMap && (
        <p role="alert">
          This location is not available on the map.
        </p>
      )}

      {error && (
        <p role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
