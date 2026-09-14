import { describe, expect, it } from "vitest";

import {
  getSessionDestination,
  type SessionStatus,
} from "./sessionRouting";

describe("getSessionDestination", () => {
  it("routes authenticated users to the main application", () => {
    expect(getSessionDestination("authenticated")).toBe("/");
  });

  it("routes unauthenticated users to login", () => {
    expect(getSessionDestination("unauthenticated")).toBe("/login");
  });

  it("does not route while authentication state is loading", () => {
    expect(getSessionDestination("loading")).toBeNull();
  });

  it("does not route automatically when session initialization fails", () => {
    expect(getSessionDestination("error")).toBeNull();
  });

  it.each<SessionStatus>([
    "loading",
    "authenticated",
    "unauthenticated",
    "error",
  ])("returns a valid routing decision for %s", (status) => {
    const result = getSessionDestination(status);

    expect(
      result === "/" ||
        result === "/login" ||
        result === null,
    ).toBe(true);
  });
});
