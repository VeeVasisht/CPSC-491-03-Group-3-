import { useEffect, useState } from "react";
import {
  addDestination,
  moveDestination,
  removeDestination,
  type OrganizedItinerary,
  type ItineraryDestination,
} from "../../models/itinerary";
import {
  deleteTripItinerary,
  listTripItineraries,
  saveTripItinerary,
} from "../../services/tripItineraryService";

interface Props {
  tripId: string;
  tripTitle: string;
}

export function ItineraryOrganizer({ tripId, tripTitle }: Props) {
  const [itineraries, setItineraries] = useState<OrganizedItinerary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [postId, setPostId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirtyIds, setDirtyIds] = useState<string[]>([]);

  const selected = itineraries.find((item) => item.id === selectedId);

  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    setNotice("");
    setItineraries([]);
    setSelectedId("");
    setDirtyIds([]);
    setNewTitle("");
    setName("");
    setLatitude("");
    setLongitude("");
    setPostId("");
    listTripItineraries(tripId)
      .then((result) => {
        if (!active) return;
        setItineraries(result);
        setSelectedId(result[0]?.id ?? "");
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load itineraries.");
      })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [tripId]);

  function resetDestinationForm() {
    setName("");
    setLatitude("");
    setLongitude("");
    setPostId("");
  }

  function updateSelected(destinations: ItineraryDestination[]) {
    setItineraries((current) => current.map((item) =>
      item.id === selectedId ? { ...item, destinations } : item,
    ));
    setDirtyIds((current) => current.includes(selectedId) ? current : [...current, selectedId]);
    setNotice("Unsaved changes. Select Save itinerary.");
    setError("");
  }

  function createItinerary() {
    const title = newTitle.trim();
    if (!title || title.length > 100) {
      setError("Itinerary title must be 1–100 characters.");
      return;
    }
    const itinerary: OrganizedItinerary = {
      id: crypto.randomUUID(), title, destinations: [],
    };
    setItineraries((current) => [...current, itinerary]);
    setSelectedId(itinerary.id);
    setDirtyIds((current) => [...current, itinerary.id]);
    resetDestinationForm();
    setNewTitle("");
    setError("");
    setNotice("Itinerary created locally. Select Save itinerary to keep it.");
  }

  function addLocation() {
    if (!selected) return;
    try {
      if (!latitude.trim() || !longitude.trim()) throw new Error("Enter both coordinates.");
      const destination: ItineraryDestination = {
        id: crypto.randomUUID(),
        location: { name, latitude: Number(latitude), longitude: Number(longitude) },
        postId: postId.trim() || null,
      };
      updateSelected(addDestination(selected.destinations, destination));
      resetDestinationForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add destination.");
    }
  }

  async function save() {
    if (!selected) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await saveTripItinerary(tripId, selected);
      setDirtyIds((current) => current.filter((id) => id !== selected.id));
      setNotice("Itinerary saved to this trip.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save itinerary.");
    } finally { setBusy(false); }
  }

  async function removeItinerary() {
    if (!selected || !window.confirm(`Delete itinerary "${selected.title}"?`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await deleteTripItinerary(tripId, selected.id);
      const remaining = itineraries.filter((item) => item.id !== selected.id);
      setItineraries(remaining);
      setSelectedId(remaining[0]?.id ?? "");
      resetDestinationForm();
      setDirtyIds((current) => current.filter((id) => id !== selected.id));
      setNotice("Itinerary deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete itinerary.");
    } finally { setBusy(false); }
  }

  const inputStyle = "mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white";
  const secondaryButton = "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700";

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-8 text-gray-900 dark:text-gray-100">
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-violet-700 p-7 text-white shadow-lg">
        <p className="text-sm font-medium text-blue-100">{tripTitle}</p>
        <h2 className="mt-1 text-3xl font-bold">Trip Itineraries</h2>
        <p className="mt-2 text-blue-100">Create multiple itineraries and organize destinations within each one.</p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-blue-50 p-3 text-blue-800 dark:bg-blue-950 dark:text-blue-200">{notice}</p>}

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="font-semibold">Itineraries for this trip</h3>
          <label className="block text-sm" htmlFor="new-itinerary-title">New itinerary name
            <input id="new-itinerary-title" className={inputStyle} maxLength={100} value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="e.g. Day trips" />
          </label>
          <button type="button" className="w-full rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 disabled:opacity-50" disabled={busy} onClick={createItinerary}>Create itinerary</button>
          <label className="block text-sm" htmlFor="choose-itinerary">Choose itinerary
            <select id="choose-itinerary" className={inputStyle} value={selectedId} onChange={(event) => {
              setSelectedId(event.target.value); resetDestinationForm(); setError(""); setNotice("");
            }}>
              <option value="">Select an itinerary</option>
              {itineraries.map((item) => <option key={item.id} value={item.id}>{item.title}{dirtyIds.includes(item.id) ? " *" : ""}</option>)}
            </select>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">* indicates unsaved changes. Save before leaving this trip.</p>
        </aside>

        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {!selected ? <p className="py-12 text-center text-gray-500 dark:text-gray-400">Create or select an itinerary to start adding destinations.</p> : <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-bold">{selected.title}</h3>
              <button type="button" disabled={busy} onClick={() => void removeItinerary()} className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400">Delete itinerary</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Location name<input className={inputStyle} value={name} onChange={(event) => setName(event.target.value)} /></label>
              <label className="text-sm">Related post ID (optional)<input className={inputStyle} value={postId} onChange={(event) => setPostId(event.target.value)} /></label>
              <label className="text-sm">Latitude<input type="number" step="any" className={inputStyle} value={latitude} onChange={(event) => setLatitude(event.target.value)} /></label>
              <label className="text-sm">Longitude<input type="number" step="any" className={inputStyle} value={longitude} onChange={(event) => setLongitude(event.target.value)} /></label>
            </div>
            <button type="button" disabled={busy} className={secondaryButton} onClick={addLocation}>Add destination</button>
            <ol className="space-y-2">
              {selected.destinations.map((item, index) => <li key={item.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 p-3 dark:border-gray-600">
                <span className="min-w-40 flex-1 text-sm">{index + 1}. {item.location.name} ({item.location.latitude}, {item.location.longitude})</span>
                <button type="button" className={secondaryButton} disabled={busy || index === 0} aria-label={`Move ${item.location.name} up`} onClick={() => updateSelected(moveDestination(selected.destinations, item.id, -1))}>↑</button>
                <button type="button" className={secondaryButton} disabled={busy || index === selected.destinations.length - 1} aria-label={`Move ${item.location.name} down`} onClick={() => updateSelected(moveDestination(selected.destinations, item.id, 1))}>↓</button>
                <button type="button" className={secondaryButton} disabled={busy} aria-label={`Remove ${item.location.name}`} onClick={() => updateSelected(removeDestination(selected.destinations, item.id))}>Remove</button>
              </li>)}
            </ol>
            <button type="button" disabled={busy} className="rounded-lg bg-blue-700 px-5 py-2 text-white hover:bg-blue-800 disabled:opacity-50" onClick={() => void save()}>{busy ? "Saving..." : "Save itinerary"}</button>
          </>}
        </div>
      </div>
    </section>
  );
}