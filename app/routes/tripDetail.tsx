import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Compass,
  MapPin,
  Pencil,
  Route,
  Sparkles,
  Trash2,
} from "lucide-react";
import { auth } from "../firebase/firebase";
import { TripForm } from "../trips/TripForm";
import type { Trip, TripInput } from "../models/trip";
import { deleteTrip, getTripById, updateTrip } from "../trips/tripService";

// Treat YYYY-MM-DD values as local calendar dates, not UTC timestamps.
function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function tripDuration(start: string, end: string) {
  const difference = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  if (!Number.isFinite(difference) || difference < 0) return null;
  return Math.round(difference / 86_400_000) + 1;
}

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!active) return;
      if (!user || !tripId) {
        setError("Log in to view this trip.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      getTripById(tripId)
        .then((result) => { if (active) setTrip(result); })
        .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load trip."); })
        .finally(() => { if (active) setLoading(false); });
    });
    return () => { active = false; unsubscribe(); };
  }, [tripId]);

  async function save(input: TripInput) {
    if (!tripId) return;
    await updateTrip(tripId, input);
    setTrip(await getTripById(tripId));
    setEditing(false);
  }

  async function remove() {
    if (!tripId || !window.confirm("Delete this trip? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      await deleteTrip(tripId);
      navigate("/trips");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete trip.");
      setDeleting(false);
    }
  }

  const duration = trip ? tripDuration(trip.startDate, trip.endDate) : null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#0b101b] dark:text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          to="/trips"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
        >
          <ArrowLeft size={17} aria-hidden="true" /> Back to My Trips
        </Link>

        {loading ? (
          <p role="status" className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-white/10 dark:bg-white/5">Loading trip…</p>
        ) : error && !trip ? (
          <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</p>
        ) : !trip ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-white/10 dark:bg-white/5">Trip not found.</p>
        ) : (
          <>
            {/* Colorful hero gives the trip a focal point without needing a destination image. */}
            <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 p-7 text-white shadow-xl shadow-indigo-900/10 sm:p-10">
              <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[40px] border-white/10" />
              <div aria-hidden="true" className="pointer-events-none absolute bottom-[-90px] right-28 h-56 w-56 rounded-full bg-sky-300/10 blur-2xl" />
              <div className="relative z-10 max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-50 backdrop-blur-sm">
                  <Compass size={14} aria-hidden="true" /> YOUR ADVENTURE
                </span>
                <h1 className="mt-5 break-words text-3xl font-bold tracking-tight sm:text-5xl">{trip.title}</h1>
                <div className="mt-4 flex items-center gap-2 text-lg text-blue-100 sm:text-xl">
                  <MapPin size={20} className="shrink-0" aria-hidden="true" />
                  <span className="break-words">{trip.destination}</span>
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                    <CalendarDays size={17} aria-hidden="true" />
                    {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                  </span>
                  {duration !== null && (
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                      <Clock3 size={17} aria-hidden="true" /> {duration} {duration === 1 ? "day" : "days"}
                    </span>
                  )}
                </div>
              </div>
              <Compass aria-hidden="true" strokeWidth={0.8} className="pointer-events-none absolute -bottom-12 -right-6 hidden h-64 w-64 rotate-[-18deg] text-white/10 sm:block" />
            </header>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</p>
            )}

            {editing ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-8">
                <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold"><Pencil size={20} /> Edit your trip</h2>
                <TripForm
                  initial={{
                    title: trip.title,
                    description: trip.description,
                    destination: trip.destination,
                    startDate: trip.startDate,
                    endDate: trip.endDate,
                  }}
                  onSubmit={save}
                  onCancel={() => setEditing(false)}
                />
              </section>
            ) : (
              <>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-7">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400"><Sparkles size={19} aria-hidden="true" /></span>
                      <h2 className="text-xl font-semibold">About this trip</h2>
                    </div>
                    <p className="whitespace-pre-wrap leading-7 text-slate-600 dark:text-slate-300">
                      {trip.description || "No description yet. Add a few notes about what you're looking forward to!"}
                    </p>
                  </section>

                  <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <h2 className="mb-4 text-base font-semibold">Manage trip</h2>
                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      >
                        <Pencil size={17} aria-hidden="true" /> Edit trip
                      </button>
                      <button
                        type="button"
                        onClick={remove}
                        disabled={deleting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <Trash2 size={17} aria-hidden="true" /> {deleting ? "Deleting…" : "Delete trip"}
                      </button>
                    </div>
                  </aside>
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-white/10 sm:px-7">
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400"><Route size={21} aria-hidden="true" /></span>
                      <div>
                        <h2 className="text-xl font-semibold">Your itinerary</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Plan each day of your adventure</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">Coming soon</span>
                  </div>
                  <div className="flex flex-col items-center px-6 py-12 text-center sm:py-14">
                    <div className="mb-5 rounded-2xl bg-indigo-50 p-5 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                      <CalendarDays size={36} strokeWidth={1.5} aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-semibold">Your journey starts here</h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Soon you'll be able to organize your trip by day, add activities, and build an itinerary all in one place.
                    </p>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
