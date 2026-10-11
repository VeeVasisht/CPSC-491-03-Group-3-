import type { Route } from "./+types/locationFeed";
import { LocationFeed } from "~/location_feed/LocationFeed";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Location Feed | WeTravel" },
    { name: "description", content: "Explore posts by region and location." },
  ];
}

export default function LocationFeedPage() {
  return <LocationFeed />;
}