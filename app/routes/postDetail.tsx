import type { Route } from "./+types/postDetail";
import { RequireAuth } from "~/components/auth/RequireAuth";
import { MainNav } from "~/components/navigation/MainNav";
import { PostDetail } from "~/map/PostDetail";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Post | WeTravel" }];
}

export default function PostDetailPage() {
  return (
    <RequireAuth>
      <MainNav />
      <PostDetail />
    </RequireAuth>
  );
}
