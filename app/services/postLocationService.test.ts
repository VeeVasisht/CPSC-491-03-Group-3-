import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  doc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(),

  db: {
    name: "mock-db",
  },
}));

vi.mock("firebase/firestore", () => ({
  doc: mocks.doc,
  updateDoc: mocks.updateDoc,
  serverTimestamp:
    mocks.serverTimestamp,
}));

vi.mock("../firebase/firebase", () => ({
  db: mocks.db,
}));

import {
  attachLocationToPost,
  removeLocationFromPost,
} from "./postLocationService";

describe("postLocationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.doc.mockReturnValue({
      path: "mock-post",
    });

    mocks.serverTimestamp.mockReturnValue(
      "mock-timestamp",
    );
  });

  it("attaches valid location data", async () => {
    mocks.updateDoc.mockResolvedValue(
      undefined,
    );

    await attachLocationToPost(
      "post-123",
      {
        name: "  Irvine, CA  ",
        latitude: 33.6846,
        longitude: -117.8265,
      },
    );

    expect(mocks.doc).toHaveBeenCalledWith(
      mocks.db,
      "posts",
      "post-123",
    );

    expect(
      mocks.updateDoc,
    ).toHaveBeenCalledWith(
      {
        path: "mock-post",
      },
      {
        location: {
          name: "Irvine, CA",
          latitude: 33.6846,
          longitude: -117.8265,
        },
        updatedAt: "mock-timestamp",
      },
    );
  });

  it("rejects invalid location data", async () => {
    await expect(
      attachLocationToPost(
        "post-123",
        {
          name: "",
          latitude: 200,
          longitude: 500,
        },
      ),
    ).rejects.toThrow(
      "Invalid location data.",
    );
  });

  it("rejects a missing post id", async () => {
    await expect(
      attachLocationToPost(
        "",
        {
          name: "Irvine",
          latitude: 33.6846,
          longitude: -117.8265,
        },
      ),
    ).rejects.toThrow(
      "Post ID is required.",
    );
  });

  it("removes location data", async () => {
    mocks.updateDoc.mockResolvedValue(
      undefined,
    );

    await removeLocationFromPost(
      "post-123",
    );

    expect(
      mocks.updateDoc,
    ).toHaveBeenCalledWith(
      {
        path: "mock-post",
      },
      {
        location: null,
        updatedAt: "mock-timestamp",
      },
    );
  });
});
