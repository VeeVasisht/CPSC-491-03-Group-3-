import type { Timestamp } from "firebase/firestore";

export interface Trip {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TripInput = Pick<Trip, "title" | "description" | "destination" | "startDate" | "endDate">;

// Reserved for the later itinerary feature; not persisted by trip CRUD yet.
export interface TripDay {
  id: string;
  date: string;
  title: string;
  order: number;
}

export interface TripActivity {
  id: string;
  title: string;
  description: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  order: number;
}
