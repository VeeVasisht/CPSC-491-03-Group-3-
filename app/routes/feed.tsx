import type { Route } from "./+types/feed";
import { Feed } from "~/components/feed/Feed";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Feed | WeTravel" },
    { name: "description", content: "Browse the latest posts." },
  ];
}

export default function FeedPage() {
  return <Feed />;
}