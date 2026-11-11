// app/routes/profile.tsx

import type { Route } from "./+types/profile";
import { RequireAuth } from "~/components/auth/RequireAuth";
import { MainNav } from "~/components/navigation/MainNav";
import { Profile } from "../profile/Profile";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Your Profile - WeTravel" },
    { name: "description", content: "View and edit your profile" },
  ];
}

export default function ProfileRoute() {
  return (
    <RequireAuth>
      <MainNav />
      <Profile />
    </RequireAuth>
  );
}
