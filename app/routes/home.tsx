import type { Route } from "./+types/home";

import { LogoutButton } from "../components/LogoutButton";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    {
      title: "WeTravel",
    },
    {
      name: "description",
      content: "Welcome to WeTravel Website!",
    },
  ];
}

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed right-6 top-6 z-50 w-32">
        <LogoutButton />
      </div>

      <Welcome />
    </div>
  );
}