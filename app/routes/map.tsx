import { BaseMap } from "~/map/Map";
import type { Route } from "./+types/map";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Map | WeTravel" },
    { name: "description", content: "View the map." },
  ];
}

export default function MapPage() {
  return <BaseMap/>;
}