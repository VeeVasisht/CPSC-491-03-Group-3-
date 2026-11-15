// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), getTrips: vi.fn(), createTrip: vi.fn(), authListener: vi.fn(),
}));
vi.mock("react-router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: unknown }) =>
    <a href={to} {...props}>{children}</a>,
  useNavigate: () => mocks.navigate,
}));
vi.mock("firebase/auth", () => ({ onAuthStateChanged: mocks.authListener }));
vi.mock("../firebase/firebase", () => ({ auth: {} }));
vi.mock("../trips/tripService", () => ({ getTrips: mocks.getTrips, createTrip: mocks.createTrip }));
import Trips from "../routes/trips";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authListener.mockImplementation((_auth, callback) => {
    callback({ uid: "owner-1" });
    return vi.fn();
  });
  mocks.getTrips.mockResolvedValue([]);
  mocks.createTrip.mockResolvedValue("new-trip");
});
afterEach(cleanup);

describe("My Trips page", () => {
  it("shows the empty state and opens the creation form", async () => {
    render(<Trips />);
    expect(await screen.findByText(/your next adventure starts here/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /new trip/i }));
    expect(screen.getByRole("heading", { name: /plan a new trip/i })).toBeTruthy();
    expect(screen.getByLabelText(/destination/i)).toBeTruthy();
  });

  it("displays saved trip cards with links to details", async () => {
    mocks.getTrips.mockResolvedValue([{ id: "germany", title: "Germany vacation", description: "", destination: "Berlin", startDate: "2026-10-26", endDate: "2026-10-31", ownerId: "owner-1" }]);
    render(<Trips />);
    expect(await screen.findByText("Germany vacation")).toBeTruthy();
    const tripLink = screen.getByText("Germany vacation").closest("a");
    expect(tripLink?.getAttribute("href")).toBe("/trips/germany");
  });

  it("creates a trip and navigates to its detail page", async () => {
    render(<Trips />);
    await screen.findByText(/your next adventure starts here/i);
    fireEvent.click(screen.getByRole("button", { name: /new trip/i }));
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Japan" } });
    fireEvent.change(screen.getByLabelText(/destination/i), { target: { value: "Tokyo" } });
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: "2026-11-10" } });
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: "2026-11-15" } });
    fireEvent.click(screen.getByRole("button", { name: /create trip/i }));
    await waitFor(() => expect(mocks.createTrip).toHaveBeenCalled());
    expect(mocks.navigate).toHaveBeenCalledWith("/trips/new-trip");
  });

  it("prompts signed-out users to log in", async () => {
    mocks.authListener.mockImplementation((_auth, callback) => { callback(null); return vi.fn(); });
    render(<Trips />);
    expect(await screen.findByText(/your trips are waiting/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /log in/i }).getAttribute("href")).toBe("/login");
    expect(mocks.getTrips).not.toHaveBeenCalled();
  });

  it("shows a readable error if listing trips fails", async () => {
    mocks.getTrips.mockRejectedValue(new Error("Unable to reach Firestore"));
    render(<Trips />);
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Unable to reach Firestore");
  });
});
