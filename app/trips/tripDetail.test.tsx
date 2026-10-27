// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), getTripById: vi.fn(), updateTrip: vi.fn(), deleteTrip: vi.fn(), authListener: vi.fn(),
}));
vi.mock("react-router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: unknown }) =>
    <a href={to} {...props}>{children}</a>,
  useNavigate: () => mocks.navigate,
  useParams: () => ({ tripId: "trip-1" }),
}));
vi.mock("firebase/auth", () => ({ onAuthStateChanged: mocks.authListener }));
vi.mock("../firebase/firebase", () => ({ auth: {} }));
vi.mock("../trips/tripService", () => ({
  getTripById: mocks.getTripById, updateTrip: mocks.updateTrip, deleteTrip: mocks.deleteTrip,
}));
import TripDetail from "../routes/tripDetail";

const trip = {
  id: "trip-1", ownerId: "owner-1", title: "Germany vacation", description: "Visit Berlin",
  destination: "Germany", startDate: "2026-10-26", endDate: "2026-10-31",
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.authListener.mockImplementation((_auth, callback) => { callback({ uid: "owner-1" }); return vi.fn(); });
  mocks.getTripById.mockResolvedValue(trip);
  mocks.updateTrip.mockResolvedValue(undefined);
  mocks.deleteTrip.mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("Trip Detail page", () => {
  it("displays trip details", async () => {
    render(<TripDetail />);
    expect(await screen.findByRole("heading", { name: "Germany vacation" })).toBeTruthy();
    expect(screen.getByText("Germany")).toBeTruthy();
    expect(screen.getByText("Visit Berlin")).toBeTruthy();
    expect(screen.getByText(/6 days/i)).toBeTruthy();
  });

  it("loads an edit form and saves changes", async () => {
    mocks.getTripById.mockResolvedValueOnce(trip).mockResolvedValueOnce({ ...trip, destination: "Munich" });
    render(<TripDetail />);
    await screen.findByRole("heading", { name: "Germany vacation" });
    fireEvent.click(screen.getByRole("button", { name: /edit trip/i }));
    fireEvent.change(screen.getByLabelText(/destination/i), { target: { value: "Munich" } });
    fireEvent.click(screen.getByRole("button", { name: /save trip/i }));
    await waitFor(() => expect(mocks.updateTrip).toHaveBeenCalledWith("trip-1", expect.objectContaining({ destination: "Munich" })));
    expect(await screen.findByText("Munich")).toBeTruthy();
  });

  it("does not delete when confirmation is declined", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    render(<TripDetail />);
    await screen.findByRole("heading", { name: "Germany vacation" });
    fireEvent.click(screen.getByRole("button", { name: /delete trip/i }));
    expect(mocks.deleteTrip).not.toHaveBeenCalled();
  });

  it("deletes and returns to My Trips when confirmed", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    render(<TripDetail />);
    await screen.findByRole("heading", { name: "Germany vacation" });
    fireEvent.click(screen.getByRole("button", { name: /delete trip/i }));
    await waitFor(() => expect(mocks.deleteTrip).toHaveBeenCalledWith("trip-1"));
    expect(mocks.navigate).toHaveBeenCalledWith("/trips");
  });

  it("shows Firestore deletion errors without navigating", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    mocks.deleteTrip.mockRejectedValue(new Error("Permission denied"));
    render(<TripDetail />);
    await screen.findByRole("heading", { name: "Germany vacation" });
    fireEvent.click(screen.getByRole("button", { name: /delete trip/i }));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Permission denied");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("shows a not-found state", async () => {
    mocks.getTripById.mockResolvedValue(null);
    render(<TripDetail />);
    expect(await screen.findByText(/trip not found/i)).toBeTruthy();
  });
});
