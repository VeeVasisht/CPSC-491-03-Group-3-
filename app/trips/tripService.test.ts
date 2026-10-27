import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TripInput } from "./trip";

const mocks = vi.hoisted(() => ({
  currentUser: { uid: "owner-1" } as { uid: string } | null,
  addDoc: vi.fn(), getDocs: vi.fn(), getDoc: vi.fn(), updateDoc: vi.fn(), deleteDoc: vi.fn(),
  collection: vi.fn(() => "trips-ref"), doc: vi.fn(), query: vi.fn(), where: vi.fn(), serverTimestamp: vi.fn(),
}));

vi.mock("../firebase/firebase", () => ({
  auth: { get currentUser() { return mocks.currentUser; } },
  db: { name: "mock-db" },
}));
vi.mock("firebase/firestore", () => ({
  addDoc: mocks.addDoc, getDocs: mocks.getDocs, getDoc: mocks.getDoc,
  updateDoc: mocks.updateDoc, deleteDoc: mocks.deleteDoc,
  collection: mocks.collection, doc: mocks.doc, query: mocks.query,
  where: mocks.where, serverTimestamp: mocks.serverTimestamp,
}));

import { createTrip, deleteTrip, getTripById, getTrips, updateTrip } from "./tripService";

const input: TripInput = {
  title: "Germany vacation", description: "Sightseeing", destination: "Germany",
  startDate: "2026-10-26", endDate: "2026-10-31",
};
const stored = { ...input, ownerId: "owner-1", createdAt: "timestamp", updatedAt: "timestamp" };

function mockTrip(data: Record<string, unknown> = stored, id = "trip-1") {
  mocks.getDoc.mockResolvedValue({ exists: () => true, id, data: () => data });
}

describe("tripService CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUser = { uid: "owner-1" };
    mocks.collection.mockReturnValue("trips-ref");
    mocks.doc.mockImplementation((_db, _name, id) => `trips/${id}`);
    mocks.where.mockReturnValue("owner-filter");
    mocks.query.mockReturnValue("owner-query");
    mocks.serverTimestamp.mockReturnValue("timestamp");
    mocks.addDoc.mockResolvedValue({ id: "new-trip" });
    mocks.updateDoc.mockResolvedValue(undefined);
    mocks.deleteDoc.mockResolvedValue(undefined);
    mockTrip();
  });

  it("creates a trip for the current user with trimmed fields and timestamps", async () => {
    const id = await createTrip({ ...input, title: " Germany vacation ", destination: " Germany " });
    expect(id).toBe("new-trip");
    expect(mocks.addDoc).toHaveBeenCalledWith("trips-ref", {
      ...input, ownerId: "owner-1", createdAt: "timestamp", updatedAt: "timestamp",
    });
  });

  it("rejects an unauthenticated create without writing data", async () => {
    mocks.currentUser = null;
    await expect(createTrip(input)).rejects.toThrow(/logged in/i);
    expect(mocks.addDoc).not.toHaveBeenCalled();
  });

  it("rejects invalid destination without writing data", async () => {
    await expect(createTrip({ ...input, destination: " " })).rejects.toThrow(/destination/i);
    expect(mocks.addDoc).not.toHaveBeenCalled();
  });

  it("queries only the signed-in user's trips and sorts by starting date", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [
      { id: "later", data: () => ({ ...stored, startDate: "2026-12-01" }) },
      { id: "earlier", data: () => ({ ...stored, startDate: "2026-10-26" }) },
    ] });
    const result = await getTrips();
    expect(mocks.where).toHaveBeenCalledWith("ownerId", "==", "owner-1");
    expect(mocks.query).toHaveBeenCalledWith("trips-ref", "owner-filter");
    expect(mocks.getDocs).toHaveBeenCalledWith("owner-query");
    expect(result.map((trip) => trip.id)).toEqual(["earlier", "later"]);
  });

  it("does not query trips when logged out", async () => {
    mocks.currentUser = null;
    await expect(getTrips()).rejects.toThrow(/logged in/i);
    expect(mocks.getDocs).not.toHaveBeenCalled();
  });

  it("retrieves an owned trip", async () => {
    await expect(getTripById("trip-1")).resolves.toMatchObject({ id: "trip-1", ownerId: "owner-1" });
    expect(mocks.getDoc).toHaveBeenCalledWith("trips/trip-1");
  });

  it("returns null for a missing trip", async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => false });
    await expect(getTripById("missing")).resolves.toBeNull();
  });

  it("rejects another user's trip", async () => {
    mockTrip({ ...stored, ownerId: "another-user" });
    await expect(getTripById("trip-1")).rejects.toThrow(/do not have access/i);
  });

  it("updates editable trip metadata and timestamp only", async () => {
    await updateTrip("trip-1", { ...input, destination: "Berlin" });
    expect(mocks.updateDoc).toHaveBeenCalledWith("trips/trip-1", {
      ...input, destination: "Berlin", updatedAt: "timestamp",
    });
    expect(mocks.updateDoc.mock.calls[0][1]).not.toHaveProperty("ownerId");
    expect(mocks.updateDoc.mock.calls[0][1]).not.toHaveProperty("createdAt");
  });

  it("does not update a missing trip", async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => false });
    await expect(updateTrip("missing", input)).rejects.toThrow(/not found/i);
    expect(mocks.updateDoc).not.toHaveBeenCalled();
  });

  it("does not update another user's trip", async () => {
    mockTrip({ ...stored, ownerId: "another-user" });
    await expect(updateTrip("trip-1", input)).rejects.toThrow(/access/i);
    expect(mocks.updateDoc).not.toHaveBeenCalled();
  });

  it("rejects invalid updates", async () => {
    await expect(updateTrip("trip-1", { ...input, endDate: "2026-10-25" })).rejects.toThrow(/end date/i);
    expect(mocks.updateDoc).not.toHaveBeenCalled();
  });

  it("deletes an owned trip", async () => {
    await deleteTrip("trip-1");
    expect(mocks.deleteDoc).toHaveBeenCalledWith("trips/trip-1");
  });

  it("does not delete a missing or another user's trip", async () => {
    mocks.getDoc.mockResolvedValueOnce({ exists: () => false });
    await expect(deleteTrip("missing")).rejects.toThrow(/not found/i);
    mockTrip({ ...stored, ownerId: "another-user" });
    await expect(deleteTrip("trip-1")).rejects.toThrow(/access/i);
    expect(mocks.deleteDoc).not.toHaveBeenCalled();
  });

  it("propagates Firestore write errors", async () => {
    mocks.addDoc.mockRejectedValue(new Error("Firestore unavailable"));
    await expect(createTrip(input)).rejects.toThrow("Firestore unavailable");
    mocks.updateDoc.mockRejectedValue(new Error("Update failed"));
    await expect(updateTrip("trip-1", input)).rejects.toThrow("Update failed");
    mocks.deleteDoc.mockRejectedValue(new Error("Delete failed"));
    await expect(deleteTrip("trip-1")).rejects.toThrow("Delete failed");
  });
});
