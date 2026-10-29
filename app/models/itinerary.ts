import {
  normalizeGeotag,
  validateGeotag,
  type Geotag,
} from "./geotag";

export interface ItineraryDestination {
  id: string;
  location: Geotag;
  postId: string | null;
}

export interface OrganizedItinerary {
  id: string;
  title: string;
  destinations: ItineraryDestination[];
}

export function validateDestination(
  destination: ItineraryDestination,
): void {
  if (!destination.id.trim()) {
    throw new Error("Destination ID is required.");
  }

  if (!validateGeotag(destination.location).valid) {
    throw new Error("A valid destination location is required.");
  }

  if (
    destination.postId !== null &&
    !destination.postId.trim()
  ) {
    throw new Error("Post ID cannot be empty.");
  }
}

export function normalizeDestinations(
  items: ItineraryDestination[],
): ItineraryDestination[] {
  if (items.length > 100) {
    throw new Error(
      "An itinerary can contain at most 100 destinations.",
    );
  }

  const ids = new Set<string>();

  return items.map((item) => {
    validateDestination(item);

    const id = item.id.trim();

    if (ids.has(id)) {
      throw new Error("Destination IDs must be unique.");
    }

    ids.add(id);

    return {
      id,
      location: normalizeGeotag(item.location),
      postId: item.postId?.trim() ?? null,
    };
  });
}

export function addDestination(
  items: ItineraryDestination[],
  item: ItineraryDestination,
): ItineraryDestination[] {
  return normalizeDestinations([...items, item]);
}

export function removeDestination(
  items: ItineraryDestination[],
  id: string,
): ItineraryDestination[] {
  return normalizeDestinations(
    items.filter((item) => item.id !== id),
  );
}

export function moveDestination(
  items: ItineraryDestination[],
  id: string,
  direction: -1 | 1,
): ItineraryDestination[] {
  const result = normalizeDestinations(items);

  const index = result.findIndex(
    (item) => item.id === id,
  );

  if (index < 0) {
    throw new Error("Destination was not found.");
  }

  const next = index + direction;

  if (next < 0 || next >= result.length) {
    return result;
  }

  [result[index], result[next]] = [
    result[next],
    result[index],
  ];

  return result;
}
