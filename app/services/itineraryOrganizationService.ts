
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import {
  normalizeDestinations,
  type ItineraryDestination,
  type OrganizedItinerary,
} from "../models/itinerary";

function requireId(value: string, label: string): string {
  if (!value.trim() || value.includes("/")) {
    throw new Error(`${label} is invalid.`);
  }

  return value.trim();
}

function itineraryRef(userId: string, itineraryId: string) {
  return doc(
    db,
    "users",
    requireId(userId, "User ID"),
    "organizedItineraries",
    requireId(itineraryId, "Itinerary ID"),
  );
}

function parseItinerary(
  id: string,
  data: Record<string, unknown>,
): OrganizedItinerary {
  const title =
    typeof data.title === "string"
      ? data.title.trim()
      : "";

  if (
    !title ||
    title.length > 100 ||
    !Array.isArray(data.destinations)
  ) {
    throw new Error("Invalid stored itinerary.");
  }

  return {
    id,
    title,
    destinations: normalizeDestinations(
      data.destinations as ItineraryDestination[],
    ),
  };
}

export async function listOrganizedItineraries(
  userId: string,
): Promise<OrganizedItinerary[]> {
  const ref = collection(
    db,
    "users",
    requireId(userId, "User ID"),
    "organizedItineraries",
  );

  const snapshot = await getDocs(ref);

  return snapshot.docs.map((item) =>
    parseItinerary(item.id, item.data()),
  );
}

export async function getOrganizedItinerary(
  userId: string,
  itineraryId: string,
): Promise<OrganizedItinerary | null> {
  const snapshot = await getDoc(
    itineraryRef(userId, itineraryId),
  );

  return snapshot.exists()
    ? parseItinerary(snapshot.id, snapshot.data())
    : null;
}

export async function saveOrganizedItinerary(
  userId: string,
  itinerary: OrganizedItinerary,
): Promise<void> {
  const id = requireId(itinerary.id, "Itinerary ID");
  const title = itinerary.title.trim();

  if (!title || title.length > 100) {
    throw new Error(
      "Trip title must be 1–100 characters.",
    );
  }

  const destinations = normalizeDestinations(
    itinerary.destinations,
  );

  await setDoc(itineraryRef(userId, id), {
    title,
    destinations,
    updatedAt: serverTimestamp(),
  });
}
