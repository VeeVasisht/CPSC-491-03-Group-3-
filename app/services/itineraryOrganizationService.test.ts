
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const firestore = vi.hoisted(() => ({
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(
    (...parts: string[]) => parts.join("/"),
  ),
  doc: vi.fn(
    (...parts: string[]) => parts.join("/"),
  ),
  getDocs: firestore.getDocs,
  getDoc: firestore.getDoc,
  setDoc: firestore.setDoc,
  serverTimestamp: vi.fn(
    () => "SERVER_TIMESTAMP",
  ),
}));

vi.mock("../firebase/firebase", () => ({
  db: "TEST_DB",
}));

import {
  getOrganizedItinerary,
  listOrganizedItineraries,
  saveOrganizedItinerary,
} from "./itineraryOrganizationService";

beforeEach(() => vi.clearAllMocks());

describe("itinerary Firestore service", () => {
  it("saves validated itineraries under the signed-in user path", async () => {
    firestore.setDoc.mockResolvedValue(undefined);

    await saveOrganizedItinerary("user-1", {
      id: "trip-1",
      title: " Paris ",
      destinations: [],
    });

    expect(firestore.setDoc).toHaveBeenCalledWith(
      "TEST_DB/users/user-1/organizedItineraries/trip-1",
      {
        title: "Paris",
        destinations: [],
        updatedAt: "SERVER_TIMESTAMP",
      },
    );
  });

  it("rejects invalid trip titles before writing", async () => {
    await expect(
      saveOrganizedItinerary("user-1", {
        id: "trip-1",
        title: " ",
        destinations: [],
      }),
    ).rejects.toThrow();

    expect(firestore.setDoc).not.toHaveBeenCalled();
  });

  it("rejects invalid user IDs before writing", async () => {
    await expect(
      saveOrganizedItinerary("../other", {
        id: "trip-1",
        title: "Trip",
        destinations: [],
      }),
    ).rejects.toThrow();

    expect(firestore.setDoc).not.toHaveBeenCalled();
  });

  it("lists the user's stored itineraries", async () => {
    firestore.getDocs.mockResolvedValue({
      docs: [
        {
          id: "trip-1",
          data: () => ({
            title: "Trip",
            destinations: [],
          }),
        },
      ],
    });

    const result = await listOrganizedItineraries(
      "user-1",
    );

    expect(result).toEqual([
      {
        id: "trip-1",
        title: "Trip",
        destinations: [],
      },
    ]);
  });

  it("returns null for a missing itinerary", async () => {
    firestore.getDoc.mockResolvedValue({
      exists: () => false,
    });

    expect(
      await getOrganizedItinerary(
        "user-1",
        "missing",
      ),
    ).toBeNull();
  });
});
