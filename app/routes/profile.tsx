// app/routes/profile.tsx

import type { Route } from "./+types/profile";
import { Profile } from "../profile/Profile";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Your Profile - WeTravel" },
    { name: "description", content: "View and edit your profile" },
  ];
}

export default function ProfileRoute() {
  return <Profile />;
}