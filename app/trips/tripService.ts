import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import type { Trip, TripInput } from "./trip";
import { validateTrip } from "./tripValidation";

const trips = collection(db, "trips");

function currentUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be logged in to manage trips.");
  return uid;
}

export async function createTrip(input: TripInput): Promise<string> {
  const ownerId = currentUid();
  const data = validateTrip(input);
  const ref = await addDoc(trips, { ...data, ownerId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function getTrips(): Promise<Trip[]> {
  const ownerId = currentUid();
  const snapshot = await getDocs(query(trips, where("ownerId", "==", ownerId)));
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as Trip)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function getTripById(id: string): Promise<Trip | null> {
  const ownerId = currentUid();
  const snapshot = await getDoc(doc(db, "trips", id));
  if (!snapshot.exists()) return null;
  const trip = { ...snapshot.data(), id: snapshot.id } as Trip;
  if (trip.ownerId !== ownerId) throw new Error("You do not have access to this trip.");
  return trip;
}

export async function updateTrip(id: string, input: TripInput): Promise<void> {
  const trip = await getTripById(id);
  if (!trip) throw new Error("Trip not found.");
  await updateDoc(doc(db, "trips", id), { ...validateTrip(input), updatedAt: serverTimestamp() });
}

export async function deleteTrip(id: string): Promise<void> {
  const trip = await getTripById(id);
  if (!trip) throw new Error("Trip not found.");
  // Only trip metadata exists in this release. Add subcollection cleanup before enabling itinerary creation.
  await deleteDoc(doc(db, "trips", id));
}
