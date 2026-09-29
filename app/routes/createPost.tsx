import CreatePost from "~/create_post/CreatePost";
import type { Route } from "./+types/createPost";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Post | WeTravel" },
    { name: "description", content: "Create a post." },
  ];
}

export default function CreatePostPage() {
  return <CreatePost/>;
}