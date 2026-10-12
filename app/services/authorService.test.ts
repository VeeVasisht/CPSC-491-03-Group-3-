import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  collection: vi.fn(),
  documentId: vi.fn(),
  getDocsFromServer: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  db: { name: "mock-db" },
}));

vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  documentId: mocks.documentId,
  getDocsFromServer: mocks.getDocsFromServer,
  query: mocks.query,
  where: mocks.where,
}));

vi.mock("../firebase/firebase", () => ({ db: mocks.db }));

import { AUTHOR_LOOKUP_CHUNK_SIZE, getAuthorNames } from "./authorService";

/** Fake `users` collection; each query returns the docs whose id is in the `in` list. */
let users: Record<string, Record<string, unknown>>;

function inIdsForCall(call: number): string[] {
  return mocks.where.mock.calls[call][2] as string[];
}

describe("getAuthorNames", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    users = {
      "u-alice": { displayName: "Alice", bio: "" },
      "u-bob": { displayName: "  Bob  ", bio: "" },
    };
    mocks.collection.mockReturnValue({});
    mocks.documentId.mockReturnValue("__name__");
    mocks.where.mockImplementation((_field, _op, ids: string[]) => ({ ids }));
    mocks.query.mockImplementation((_ref, constraint: { ids: string[] }) => constraint);
    mocks.getDocsFromServer.mockImplementation(async ({ ids }: { ids: string[] }) => ({
      docs: ids
        .filter((id) => id in users)
        .map((id) => ({ id, data: () => users[id] })),
    }));
  });

  it("returns display names for authors that exist", async () => {
    const names = await getAuthorNames(["u-alice", "u-bob"]);
    expect(names.get("u-alice")).toBe("Alice");
    expect(names.get("u-bob")).toBe("Bob");
    expect(mocks.collection).toHaveBeenCalledWith(mocks.db, "users");
    expect(mocks.where).toHaveBeenCalledWith("__name__", "in", ["u-alice", "u-bob"]);
  });

  it("leaves out authors whose user doc is missing", async () => {
    const names = await getAuthorNames(["u-alice", "u-ghost"]);
    expect([...names.keys()]).toEqual(["u-alice"]);
  });

  it("leaves out authors with a missing or blank displayName", async () => {
    users["u-noname"] = { bio: "" };
    users["u-blank"] = { displayName: "   " };
    users["u-number"] = { displayName: 42 };
    const names = await getAuthorNames(["u-noname", "u-blank", "u-number", "u-alice"]);
    expect([...names.keys()]).toEqual(["u-alice"]);
  });

  it("queries each duplicate author only once, in a single query", async () => {
    const names = await getAuthorNames(["u-alice", "u-bob", "u-alice", "u-alice", "u-bob"]);
    expect(mocks.getDocsFromServer).toHaveBeenCalledTimes(1);
    expect(inIdsForCall(0)).toEqual(["u-alice", "u-bob"]);
    expect(names.size).toBe(2);
  });

  it("does not query at all for an empty list", async () => {
    expect((await getAuthorNames([])).size).toBe(0);
    expect((await getAuthorNames(["", ""])).size).toBe(0);
    expect(mocks.getDocsFromServer).not.toHaveBeenCalled();
  });

  it("splits more than the 'in' limit into chunks", async () => {
    const ids = Array.from({ length: AUTHOR_LOOKUP_CHUNK_SIZE * 2 + 5 }, (_, i) => `u-${i}`);
    for (const id of ids) users[id] = { displayName: `Name ${id}` };

    const names = await getAuthorNames(ids);

    expect(mocks.getDocsFromServer).toHaveBeenCalledTimes(3);
    expect(inIdsForCall(0)).toHaveLength(AUTHOR_LOOKUP_CHUNK_SIZE);
    expect(inIdsForCall(1)).toHaveLength(AUTHOR_LOOKUP_CHUNK_SIZE);
    expect(inIdsForCall(2)).toHaveLength(5);
    expect(names.size).toBe(ids.length);
  });

  it("rejects when the server is unreachable", async () => {
    mocks.getDocsFromServer.mockRejectedValue(new Error("unavailable"));
    await expect(getAuthorNames(["u-alice"])).rejects.toThrow("unavailable");
  });
});
