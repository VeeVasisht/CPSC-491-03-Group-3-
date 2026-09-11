// app/models/userProfile.test.ts

import { describe, it, expect } from "vitest";
import {
  validateProfileFields,
  hasProfileChanges,
  DISPLAY_NAME_MIN,
  DISPLAY_NAME_MAX,
  BIO_MAX,
} from "./userProfile";

describe("validateProfileFields", () => {
  it("accepts a valid name and bio", () => {
    const result = validateProfileFields({ displayName: "Reign", bio: "CS student" });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("accepts an empty bio (bio is optional)", () => {
    const result = validateProfileFields({ displayName: "Reign", bio: "" });
    expect(result.valid).toBe(true);
  });

  it("rejects a name shorter than the minimum", () => {
    const result = validateProfileFields({ displayName: "R", bio: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.displayName).toBeDefined();
  });

  it("rejects a whitespace-only name (trimmed before checking)", () => {
    const result = validateProfileFields({ displayName: "   ", bio: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.displayName).toBeDefined();
  });

  it("accepts names at the exact boundaries", () => {
    const min = "a".repeat(DISPLAY_NAME_MIN);
    const max = "a".repeat(DISPLAY_NAME_MAX);
    expect(validateProfileFields({ displayName: min, bio: "" }).valid).toBe(true);
    expect(validateProfileFields({ displayName: max, bio: "" }).valid).toBe(true);
  });

  it("rejects a name longer than the maximum", () => {
    const tooLong = "a".repeat(DISPLAY_NAME_MAX + 1);
    const result = validateProfileFields({ displayName: tooLong, bio: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.displayName).toBeDefined();
  });

  it("accepts a bio at the max length but rejects one over it", () => {
    const atMax = "a".repeat(BIO_MAX);
    const overMax = "a".repeat(BIO_MAX + 1);
    expect(validateProfileFields({ displayName: "Reign", bio: atMax }).valid).toBe(true);
    const over = validateProfileFields({ displayName: "Reign", bio: overMax });
    expect(over.valid).toBe(false);
    expect(over.errors.bio).toBeDefined();
  });

  it("reports errors on both fields at once", () => {
    const result = validateProfileFields({
      displayName: "",
      bio: "a".repeat(BIO_MAX + 1),
    });
    expect(result.valid).toBe(false);
    expect(result.errors.displayName).toBeDefined();
    expect(result.errors.bio).toBeDefined();
  });
});

describe("hasProfileChanges", () => {
  const base = { displayName: "Reign", bio: "CS student" };

  it("returns false when nothing changed", () => {
    expect(hasProfileChanges(base, { ...base })).toBe(false);
  });

  it("returns false when only surrounding whitespace differs", () => {
    expect(hasProfileChanges(base, { displayName: "  Reign  ", bio: "CS student" })).toBe(false);
  });

  it("detects a changed display name", () => {
    expect(hasProfileChanges(base, { ...base, displayName: "Charles" })).toBe(true);
  });

  it("detects a changed bio", () => {
    expect(hasProfileChanges(base, { ...base, bio: "Founder" })).toBe(true);
  });
});