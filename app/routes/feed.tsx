import type { Route } from "./+types/feed";
import { RequireAuth } from "~/components/auth/RequireAuth";
import { Feed } from "~/components/feed/Feed";
import { MainNav } from "~/components/navigation/MainNav";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Feed | WeTravel" },
    { name: "description", content: "Browse the latest posts." },
  ];
}

export default function FeedPage() {
  return (
    <RequireAuth>
      <MainNav />
      <Feed />
    </RequireAuth>
  );
}