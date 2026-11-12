import { useEffect, useState } from "react";
import { OfflineItineraryStatus } from "./OfflineItineraryStatus";
import { readOfflineItineraries, writeOfflineItineraries, upsertOfflineItinerary } from "../../services/offlineItineraryCache";

import type {
  OrganizedItinerary,
  ItineraryDestination,
} from "../../models/itinerary";

import {
  addDestination,
  moveDestination,
  removeDestination,
} from "../../models/itinerary";

import {
  listOrganizedItineraries,
  saveOrganizedItinerary,
} from "../../services/itineraryOrganizationService";

interface Props {
  userId: string;
}

export function ItineraryOrganizer({ userId }: Props) {
  const [trips, setTrips] = useState<
    OrganizedItinerary[]
  >([]);

  const [selectedId, setSelectedId] = useState("");
  const [tripName, setTripName] = useState("");
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [postId, setPostId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasOfflineCopy, setHasOfflineCopy] = useState(false);

  const selected = trips.find(
    (trip) => trip.id === selectedId,
  );

  useEffect(() => {
    let active = true;

    setBusy(true);
    const cached = readOfflineItineraries(userId);
    setTrips(cached);
    setSelectedId(cached[0]?.id ?? "");
    setHasOfflineCopy(cached.length > 0);
    if (!navigator.onLine) {
      setNotice(cached.length ? "Showing saved offline trips." : "No saved offline trips available.");
      setBusy(false);
      return () => { active = false; };
    }

    listOrganizedItineraries(userId)
      .then((result) => {
        if (active) {
          setTrips(result);
          setSelectedId(result[0]?.id ?? "");
          const stored = writeOfflineItineraries(userId, result);
          setHasOfflineCopy(stored && result.length > 0);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setNotice(cached.length ? "Unable to refresh. Showing saved offline trips." : "");
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load itineraries.",
          );
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  function updateSelected(
    destinations: ItineraryDestination[],
  ) {
    setTrips((current) =>
      current.map((trip) =>
        trip.id === selectedId
          ? { ...trip, destinations }
          : trip,
      ),
    );

    setNotice(
      "Unsaved changes. Select Save itinerary.",
    );
    setError("");
  }

  function createTrip() {
    const title = tripName.trim();

    if (!title || title.length > 100) {
      setError(
        "Trip title must be 1–100 characters.",
      );
      return;
    }

    const trip: OrganizedItinerary = {
      id: crypto.randomUUID(),
      title,
      destinations: [],
    };

    setTrips((current) => [...current, trip]);
    setSelectedId(trip.id);
    setTripName("");
    setError("");
    setNotice(
      "New trip created locally. Select Save itinerary to keep it.",
    );
  }

  function addLocation() {
    if (!selected) return;

    try {
      const destination: ItineraryDestination = {
        id: crypto.randomUUID(),
        location: {
          name,
          latitude: Number(latitude),
          longitude: Number(longitude),
        },
        postId: postId.trim() || null,
      };

      if (
        !latitude.trim() ||
        !longitude.trim()
      ) {
        throw new Error(
          "Enter both coordinates.",
        );
      }

      updateSelected(
        addDestination(
          selected.destinations,
          destination,
        ),
      );

      setName("");
      setLatitude("");
      setLongitude("");
      setPostId("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add destination.",
      );
    }
  }

  async function save() {
    if (!selected) return;
    if (!navigator.onLine) {
      setError("Offline — connect to the internet to save changes to Firestore.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await saveOrganizedItinerary(
        userId,
        selected,
      );
      const cached = upsertOfflineItinerary(userId, selected);
      setHasOfflineCopy(cached);
      setNotice(cached ? "Itinerary saved. Offline copy updated." : "Itinerary saved. Offline copy unavailable.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save itinerary.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-5 p-6">
      <OfflineItineraryStatus cached={hasOfflineCopy} />
      <h1 className="text-2xl font-bold">
        Itinerary Organizer
      </h1>

      <p>
        Organize destinations for your trips.
        Changes are saved when you select
        Save itinerary.
      </p>

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {notice && (
        <p role="status">
          {notice}
        </p>
      )}

      <section className="space-y-2">
        <label htmlFor="trip-name">
          New trip name
        </label>

        <input
          id="trip-name"
          className="border p-2"
          maxLength={100}
          value={tripName}
          onChange={(e) =>
            setTripName(e.target.value)
          }
        />

        <button
          className="border rounded p-2"
          type="button"
          onClick={createTrip}
        >
          Create trip
        </button>
      </section>

      <section className="space-y-3">
        <label htmlFor="trip-select">
          Choose itinerary
        </label>

        <select
          id="trip-select"
          className="border p-2"
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setError("");
            setNotice("");
          }}
        >
          <option value="">
            Select a trip
          </option>

          {trips.map((trip) => (
            <option
              key={trip.id}
              value={trip.id}
            >
              {trip.title}
            </option>
          ))}
        </select>

        {selected && (
          <>
            <h2 className="text-xl font-semibold">
              {selected.title}
            </h2>

            <div className="grid gap-2 sm:grid-cols-2">
              <label>
                Location name
                <input
                  className="block border p-2"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                />
              </label>

              <label>
                Latitude
                <input
                  className="block border p-2"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) =>
                    setLatitude(e.target.value)
                  }
                />
              </label>

              <label>
                Longitude
                <input
                  className="block border p-2"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) =>
                    setLongitude(e.target.value)
                  }
                />
              </label>

              <label>
                Related post ID (optional)
                <input
                  className="block border p-2"
                  value={postId}
                  onChange={(e) =>
                    setPostId(e.target.value)
                  }
                />
              </label>
            </div>

            <button
              type="button"
              className="border rounded p-2"
              onClick={addLocation}
            >
              Add destination
            </button>

            <p className="text-sm">Saved destination names and coordinates remain visible offline. Live maps require a connection unless map tiles are separately cached.</p>
            <ol className="space-y-2">
              {selected.destinations.map(
                (item, index) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center gap-2 border rounded p-2"
                  >
                    <span className="flex-1">
                      {index + 1}.{" "}
                      {item.location.name} (
                      {item.location.latitude},{" "}
                      {item.location.longitude})
                    </span>

                    <button
                      type="button"
                      aria-label={`Move ${item.location.name} up`}
                      disabled={index === 0}
                      onClick={() =>
                        updateSelected(
                          moveDestination(
                            selected.destinations,
                            item.id,
                            -1,
                          ),
                        )
                      }
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      aria-label={`Move ${item.location.name} down`}
                      disabled={
                        index ===
                        selected.destinations.length - 1
                      }
                      onClick={() =>
                        updateSelected(
                          moveDestination(
                            selected.destinations,
                            item.id,
                            1,
                          ),
                        )
                      }
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      aria-label={`Remove ${item.location.name}`}
                      onClick={() =>
                        updateSelected(
                          removeDestination(
                            selected.destinations,
                            item.id,
                          ),
                        )
                      }
                    >
                      Remove
                    </button>
                  </li>
                ),
              )}
            </ol>

            <button
              type="button"
              disabled={busy}
              className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
              onClick={() => void save()}
            >
              {busy
                ? "Saving..."
                : "Save itinerary"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
