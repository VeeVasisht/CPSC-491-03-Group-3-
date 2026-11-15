
import { RequireAuth } from "~/components/auth/RequireAuth";
import { MainNav } from "~/components/navigation/MainNav";
import { ItineraryOrganizer } from "~/components/itinerary/ItineraryOrganizer";
import { useAuthSession } from "~/session/AuthSessionContext";

function AuthenticatedItineraries() {
  const { user } = useAuthSession();

  if (!user) return null;

  return (
    <ItineraryOrganizer userId={user.uid} />
  );
}

export default function ItinerariesPage() {
  return (
    <RequireAuth>
      <MainNav />
      <AuthenticatedItineraries />
    </RequireAuth>
  );
}
