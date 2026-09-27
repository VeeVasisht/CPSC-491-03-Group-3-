import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  setPersistence: vi.fn(),
  onAuthStateChanged: vi.fn(),
  browserLocalPersistence: {
    type: "LOCAL",
  },
}));

vi.mock("firebase/auth", () => ({
  setPersistence: mocks.setPersistence,
  onAuthStateChanged: mocks.onAuthStateChanged,
  browserLocalPersistence:
    mocks.browserLocalPersistence,
}));

import {
  configureSessionPersistence,
  observeAuthSession,
} from "./sessionService";

describe("sessionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("configureSessionPersistence", () => {
    it("configures Firebase Auth with browser local persistence", async () => {
      const fakeAuth = {
        name: "mock-auth",
      };

      mocks.setPersistence.mockResolvedValue(undefined);

      await configureSessionPersistence(
        fakeAuth as never,
      );

      expect(mocks.setPersistence).toHaveBeenCalledTimes(1);

      expect(mocks.setPersistence).toHaveBeenCalledWith(
        fakeAuth,
        mocks.browserLocalPersistence,
      );
    });

    it("propagates persistence configuration failures", async () => {
      const fakeAuth = {
        name: "mock-auth",
      };

      const persistenceError =
        new Error("Persistence unavailable");

      mocks.setPersistence.mockRejectedValue(
        persistenceError,
      );

      await expect(
        configureSessionPersistence(fakeAuth as never),
      ).rejects.toBe(persistenceError);
    });
  });

  describe("observeAuthSession", () => {
    it("subscribes to Firebase authentication changes", () => {
      const fakeAuth = {
        name: "mock-auth",
      };

      const onChange = vi.fn();
      const onError = vi.fn();
      const unsubscribe = vi.fn();

      mocks.onAuthStateChanged.mockReturnValue(
        unsubscribe,
      );

      const result = observeAuthSession(
        fakeAuth as never,
        onChange,
        onError,
      );

      expect(
        mocks.onAuthStateChanged,
      ).toHaveBeenCalledTimes(1);

      expect(
        mocks.onAuthStateChanged,
      ).toHaveBeenCalledWith(
        fakeAuth,
        onChange,
        onError,
      );

      expect(result).toBe(unsubscribe);
    });

    it("returns the Firebase unsubscribe callback", () => {
      const unsubscribe = vi.fn();

      mocks.onAuthStateChanged.mockReturnValue(
        unsubscribe,
      );

      const result = observeAuthSession(
        {} as never,
        vi.fn(),
        vi.fn(),
      );

      expect(result).toBe(unsubscribe);
    });
  });
});
