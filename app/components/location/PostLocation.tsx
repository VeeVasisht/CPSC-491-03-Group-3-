import type { Geotag } from "../../models/geotag";

interface PostLocationProps {
  location?: Geotag | null;
}

export function PostLocation({
  location,
}: PostLocationProps) {
  if (!location) {
    return null;
  }

  return (
    <p className="text-sm text-gray-600 dark:text-gray-300">
      📍 {location.name}
    </p>
  );
}
