import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  Luggage,
  MapPin,
  Plus,
  Route,
  Sparkles,
  X,
} from "lucide-react";
import { auth } from "../firebase/firebase";
import { TripForm } from "../trips/TripForm";
import type { Trip, TripInput } from "../trips/trip";
import { createTrip, getTrips } from "../trips/tripService";

// Parse date-only strings as calendar dates to avoid timezone shifts.
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

export default function MyTrips() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!active) return;
      setSignedIn(Boolean(user));
      setError("");
      if (!user) {
        setItems([]);
        setShowForm(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      getTrips()
        .then((trips) => { if (active) setItems(trips); })
        .catch((e) => {
          if (active) setError(e instanceof Error ? e.message : "Unable to load trips.");
        })
        .finally(() => { if (active) setLoading(false); });
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  async function addTrip(input: TripInput) {
    const id = await createTrip(input);
    navigate(`/trips/${id}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#0b101b] dark:text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-7">
        {/* Match the Trip Detail page's gradient hero and travel-themed accents. */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 p-7 text-white shadow-xl shadow-indigo-900/10 sm:p-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[40px] border-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-[-90px] right-28 h-56 w-56 rounded-full bg-sky-300/10 blur-2xl" />
          <Compass aria-hidden="true" strokeWidth={0.8} className="pointer-events-none absolute -bottom-12 -right-6 hidden h-64 w-64 rotate-[-18deg] text-white/10 sm:block" />
          <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-50 backdrop-blur-sm">
                <Compass size={14} aria-hidden="true" /> YOUR ADVENTURES
              </span>
              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">My Trips</h1>
              <p className="mt-3 max-w-lg text-base leading-7 text-blue-100">
                Every great journey starts with a plan. Keep your destinations, dates, and travel ideas together.
              </p>
            </div>
            {signedIn && (
              <button
                type="button"
                onClick={() => setShowForm((value) => !value)}
                aria-expanded={showForm}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-md transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {showForm ? <X size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                {showForm ? "Close form" : "New Trip"}
              </button>
            )}
          </div>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        )}

        {showForm && signedIn && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                <Plus size={21} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Plan a new trip</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tell us where you're headed.</p>
              </div>
            </div>
            <TripForm onSubmit={addTrip} onCancel={() => setShowForm(false)} submitLabel="Create trip" />
          </section>
        )}

        {loading ? (
          <p role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
            Loading trips…
          </p>
        ) : !signedIn ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Luggage size={32} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold">Your trips are waiting</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Log in to view your saved adventures and start planning your next one.</p>
            <Link to="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
              Log in <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </section>
        ) : (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                  <Route size={21} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold">Your travel plans</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Explore and manage your adventures</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                {items.length} {items.length === 1 ? "trip" : "trips"}
              </span>
            </div>

            {items.length === 0 && !error ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Sparkles size={32} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold">Your next adventure starts here</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                  No trips planned yet. Create your first trip to keep your destination, dates, and plans in one place.
                </p>
                {!showForm && (
                  <button type="button" onClick={() => setShowForm(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                    <Plus size={17} aria-hidden="true" /> Create your first trip
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((trip) => {
                  const duration = tripDuration(trip.startDate, trip.endDate);
                  return (
                    <Link
                      key={trip.id}
                      to={`/trips/${trip.id}`}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 dark:border-white/10 dark:bg-slate-900 dark:hover:border-blue-500/60"
                    >
                      <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white">
                        <div aria-hidden="true" className="absolute -right-6 -top-12 h-40 w-40 rounded-full border-[22px] border-white/10" />
                        <Compass size={58} strokeWidth={1} className="text-white/60 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" aria-hidden="true" />
                        <span className="absolute bottom-3 left-4 inline-flex max-w-[calc(100%-2rem)] items-center gap-1.5 truncate rounded-full bg-black/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                          <MapPin size={13} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">{trip.destination}</span>
                        </span>
                      </div>
                      <div className="space-y-4 p-5">
                        <h3 className="line-clamp-2 text-lg font-semibold tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400">{trip.title}</h3>
                        <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <CalendarDays size={17} className="mt-0.5 shrink-0 text-indigo-500 dark:text-indigo-400" aria-hidden="true" />
                          <span>{formatDate(trip.startDate)} – {formatDate(trip.endDate)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm dark:border-white/10">
                          <span className="text-slate-500 dark:text-slate-400">{duration === null ? "Trip" : `${duration} ${duration === 1 ? "day" : "days"}`}</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                            View trip <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
