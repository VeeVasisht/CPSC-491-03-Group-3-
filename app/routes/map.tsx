import { useSearchParams } from "react-router";
import { BaseMap } from "~/map/Map";
import type { Route } from "./+types/map";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Map | WeTravel" },
    { name: "description", content: "View the map." },
  ];
}

export default function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  return (
    <BaseMap
      focusPostId={searchParams.get("postId")}
      onPostSelect={(postId) => {
        setSearchParams((previous) => {
          const next = new URLSearchParams(previous);
          next.set("postId", postId);
          return next;
        }, { replace: true });
      }}
    />
  );
}
