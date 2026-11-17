import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import {
  normalizeDestinations,
  type OrganizedItinerary,
} from "../models/itinerary";

function requireUser() {
  if (!auth.currentUser) throw new Error("You must be signed in.");
  return auth.currentUser;
}

function itineraryCollection(tripId: string) {
  if (!tripId.trim()) throw new Error("A trip is required.");
  return collection(db, "trips", tripId, "itineraries");
}

/** Lists itineraries nested under one trip. Firestore rules enforce ownership. */
export async function listTripItineraries(tripId: string): Promise<OrganizedItinerary[]> {
  requireUser();
  const snapshot = await getDocs(itineraryCollection(tripId));
  return snapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      id: entry.id,
      title: data.title as string,
      destinations: data.destinations as OrganizedItinerary["destinations"],
    };
  }).sort((a, b) => a.title.localeCompare(b.title));
}

/** Creates or updates an itinerary within a particular trip. */
export async function saveTripItinerary(
  tripId: string,
  itinerary: OrganizedItinerary,
): Promise<void> {
  requireUser();
  const title = itinerary.title.trim();
  if (!title || title.length > 100) {
    throw new Error("Itinerary title must be 1–100 characters.");
  }
  if (!itinerary.id.trim() || itinerary.id.includes("/")) {
    throw new Error("Invalid itinerary ID.");
  }
  const destinations = normalizeDestinations(itinerary.destinations);
  await setDoc(doc(itineraryCollection(tripId), itinerary.id), {
    title,
    destinations,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTripItinerary(tripId: string, itineraryId: string): Promise<void> {
  requireUser();
  if (!itineraryId.trim() || itineraryId.includes("/")) {
    throw new Error("Invalid itinerary ID.");
  }
  await deleteDoc(doc(itineraryCollection(tripId), itineraryId));
}
