import { beforeEach, describe, expect, it, vi } from "vitest";

import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { createPost } from "./posts";

let mockCurrentUser: { uid: string } | null = null;

vi.mock("./firebase", () => ({
  auth: {
    get currentUser() {
      return mockCurrentUser;
    },
  },
  db: {},
  storage: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock("firebase/storage", () => ({
  deleteObject: vi.fn(),
  getDownloadURL: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
}));

describe("createPost", () => {
  const mockPostRef = {
    id: "post-123",
  };

  const mockImageRef = {
    fullPath: "posts/test-user-123/post-123.png",
  };

  const mockTimestamp = {} as unknown as ReturnType<typeof serverTimestamp>;

  const mockImageUrl = "http://127.0.0.1:9199/v0/b/test-project/o/test-image";

  const mockImage = new File(["fake image contents"], "test-image.png", {
    type: "image/png",
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockCurrentUser = {
      uid: "test-user-123",
    };

    vi.mocked(collection).mockReturnValue({} as ReturnType<typeof collection>);

    vi.mocked(doc).mockReturnValue(mockPostRef as ReturnType<typeof doc>);

    vi.mocked(ref).mockReturnValue(mockImageRef as ReturnType<typeof ref>);

    vi.mocked(serverTimestamp).mockReturnValue(
      mockTimestamp as ReturnType<typeof serverTimestamp>,
    );

    vi.mocked(uploadBytes).mockResolvedValue(
      {} as Awaited<ReturnType<typeof uploadBytes>>,
    );

    vi.mocked(getDownloadURL).mockResolvedValue(mockImageUrl);

    vi.mocked(setDoc).mockResolvedValue();

    vi.mocked(deleteObject).mockResolvedValue();
  });

  it("creates a post with the authenticated user as the author", async () => {
    const postId = await createPost({
      title: "Test Post",
      description: "This is a test post.",
      image: mockImage,
    });

    expect(postId).toBe("post-123");

    expect(setDoc).toHaveBeenCalledWith(mockPostRef, {
      authorId: "test-user-123",
      title: "Test Post",
      description: "This is a test post.",
      imageUrl: mockImageUrl,
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
    });
  });

  it("uploads the image before creating the Firestore post", async () => {
    await createPost({
      title: "Test Post",
      description: "This is a test post.",
      image: mockImage,
    });

    expect(ref).toHaveBeenCalled();

    expect(uploadBytes).toHaveBeenCalledWith(mockImageRef, mockImage);

    expect(getDownloadURL).toHaveBeenCalledWith(mockImageRef);

    expect(setDoc).toHaveBeenCalled();
  });

  it("stores the image under the authenticated user's post directory", async () => {
    await createPost({
      title: "Test Post",
      description: "This is a test post.",
      image: mockImage,
    });

    expect(ref).toHaveBeenCalledWith(
      expect.anything(),
      "posts/test-user-123/post-123.png",
    );
  });

  it("trims the title and description before storing them", async () => {
    await createPost({
      title: "   Test Post   ",
      description: "   Test description.   ",
      image: mockImage,
    });

    expect(setDoc).toHaveBeenCalledWith(
      mockPostRef,
      expect.objectContaining({
        title: "Test Post",
        description: "Test description.",
      }),
    );
  });

  it("rejects post creation if the user is not authenticated", async () => {
    mockCurrentUser = null;

    await expect(
      createPost({
        title: "Test Post",
        description: "This is a test post.",
        image: mockImage,
      }),
    ).rejects.toThrow("You must be logged in to create a post.");

    expect(uploadBytes).not.toHaveBeenCalled();
    expect(setDoc).not.toHaveBeenCalled();
  });

  it("rejects a post with an empty title", async () => {
    await expect(
      createPost({
        title: "   ",
        description: "This is a test post.",
        image: mockImage,
      }),
    ).rejects.toThrow("A title is required.");

    expect(uploadBytes).not.toHaveBeenCalled();
    expect(setDoc).not.toHaveBeenCalled();
  });

  it("rejects a post with an empty description", async () => {
    await expect(
      createPost({
        title: "Test Post",
        description: "   ",
        image: mockImage,
      }),
    ).rejects.toThrow("A description is required.");

    expect(uploadBytes).not.toHaveBeenCalled();
    expect(setDoc).not.toHaveBeenCalled();
  });

  it("rejects unsupported image types", async () => {
    const invalidImage = new File(["invalid file"], "test.gif", {
      type: "image/gif",
    });

    await expect(
      createPost({
        title: "Test Post",
        description: "This is a test post.",
        image: invalidImage,
      }),
    ).rejects.toThrow("Image must be a JPEG, PNG, or WebP file.");

    expect(uploadBytes).not.toHaveBeenCalled();
    expect(setDoc).not.toHaveBeenCalled();
  });

  it("deletes the uploaded image if Firestore creation fails", async () => {
    const firestoreError = new Error("Firestore creation failed");

    vi.mocked(setDoc).mockRejectedValue(firestoreError);

    await expect(
      createPost({
        title: "Test Post",
        description: "This is a test post.",
        image: mockImage,
      }),
    ).rejects.toThrow("Firestore creation failed");

    expect(deleteObject).toHaveBeenCalledWith(mockImageRef);
  });

  it("preserves the original error if image cleanup also fails", async () => {
    const firestoreError = new Error("Firestore creation failed");

    vi.mocked(setDoc).mockRejectedValue(firestoreError);

    vi.mocked(deleteObject).mockRejectedValue(
      new Error("Storage cleanup failed"),
    );

    await expect(
      createPost({
        title: "Test Post",
        description: "This is a test post.",
        image: mockImage,
      }),
    ).rejects.toBe(firestoreError);
  });
});
