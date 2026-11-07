import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { RequireAuth } from "~/components/auth/RequireAuth";
import { MainNav } from "~/components/navigation/MainNav";
import { ItineraryOrganizer } from "~/components/itinerary/ItineraryOrganizer";
import { db } from "~/firebase/firebase";
import { useAuthSession } from "~/session/AuthSessionContext";

type TripOption = { id: string; title: string };

function AuthenticatedItineraries() {
  const { user } = useAuthSession();
  const { tripId } = useParams();
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [selectedId, setSelectedId] = useState(tripId ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setTrips([]);
    setSelectedId(tripId ?? "");
    if (!user) {
      setLoading(false);
      return;
    }

    const promise = tripId
      ? getDoc(doc(db, "trips", tripId)).then((snapshot) => {
          if (!snapshot.exists())
            throw new Error("Trip not found or access denied.");
          return [{ id: snapshot.id, title: String(snapshot.data().title) }];
        })
      : getDocs(
          query(collection(db, "trips"), where("ownerId", "==", user.uid)),
        ).then((snapshot) =>
          snapshot.docs
            .map((item) => ({
              id: item.id,
              title: String(item.data().title),
            }))
            .sort((a, b) => a.title.localeCompare(b.title)),
        );

    promise
      .then((result) => {
        if (!active) return;
        setTrips(result);
        setSelectedId(tripId ?? result[0]?.id ?? "");
      })
      .catch((err: unknown) => {
        if (active)
          setError(
            err instanceof Error ? err.message : "Unable to load trips.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tripId, user?.uid]);

  if (!user) return null;
  const selected = trips.find((item) => item.id === selectedId);

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-7 text-gray-900 dark:text-gray-100">
      <Link
        to="/trips"
        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        ← Back to My Trips
      </Link>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </p>
      )}
      {loading ? (
        <p>Loading trips...</p>
      ) : (
        <>
          {!tripId && trips.length > 0 && (
            <label className="block max-w-md text-sm font-medium">
              Trip
              <select
                className="mt-2 block w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                {trips.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          {selected ? (
            <ItineraryOrganizer
              key={selected.id}
              tripId={selected.id}
              tripTitle={selected.title}
            />
          ) : (
            !error && (
              <div className="rounded-xl border p-6">
                No trips yet.{" "}
                <Link className="text-blue-600 underline" to="/trips">
                  Create a trip
                </Link>{" "}
                before adding itineraries.
              </div>
            )
          )}
        </>
      )}
    </main>
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
