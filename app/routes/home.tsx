import type { Route } from "./+types/home";

import { RequireAuth } from "../components/auth/RequireAuth";
import { MainNav } from "../components/navigation/MainNav";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    {
      title: "WeTravel",
    },
    {
      name: "description",
      content: "Welcome to WeTravel!",
    },
  ];
}

export default function Home() {
  return (
    <RequireAuth>
      <MainNav />

      <Welcome />
    </RequireAuth>
  );
}
