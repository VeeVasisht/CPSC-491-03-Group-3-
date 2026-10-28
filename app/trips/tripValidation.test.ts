import { describe, expect, it } from "vitest";
import { validateTrip } from "./tripValidation";
import type { TripInput } from "../models/trip";

const valid: TripInput = {
  title: "Weekend trip", description: "", destination: "Seattle",
  startDate: "2026-11-10", endDate: "2026-11-12",
};

describe("validateTrip", () => {
  it("accepts and trims a valid trip", () => {
    expect(validateTrip({ ...valid, destination: " Seattle " }).destination).toBe("Seattle");
  });
  it("requires a destination", () => {
    expect(() => validateTrip({ ...valid, destination: "   " })).toThrow(/Destination/);
  });
  it("requires a title", () => {
    expect(() => validateTrip({ ...valid, title: " " })).toThrow(/Title/);
  });
  it("rejects reversed dates", () => {
    expect(() => validateTrip({ ...valid, endDate: "2026-11-09" })).toThrow(/End date/);
  });
  it("rejects invalid calendar dates", () => {
    expect(() => validateTrip({ ...valid, startDate: "2026-02-30" })).toThrow(/valid trip dates/);
  });
  it("rejects a description over 2000 characters", () => {
    expect(() => validateTrip({ ...valid, description: "a".repeat(2001) })).toThrow(/Description/);
  });
});
