import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "WeTravel" },
    { name: "description", content: "Welcome to WeTravel Website!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
