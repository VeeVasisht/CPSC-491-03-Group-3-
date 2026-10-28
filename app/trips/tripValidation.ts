import type { TripInput } from "../models/trip";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateTrip(input: TripInput): TripInput {
  const trip = {
    title: input.title.trim(),
    description: input.description.trim(),
    destination: input.destination.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
  };
  if (trip.title.length < 1 || trip.title.length > 100) throw new Error("Title must be 1–100 characters.");
  if (trip.destination.length < 1 || trip.destination.length > 150) throw new Error("Destination must be 1–150 characters.");
  if (trip.description.length > 2000) throw new Error("Description must be 2,000 characters or less.");
  if (!validDate(trip.startDate) || !validDate(trip.endDate)) throw new Error("Enter valid trip dates.");
  if (trip.endDate < trip.startDate) throw new Error("End date cannot be before start date.");
  return trip;
}
