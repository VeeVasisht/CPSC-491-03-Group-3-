import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  storage: {
    name: "mock-storage",
  },
}));

vi.mock("firebase/storage", () => ({
  ref: mocks.ref,
  uploadBytes: mocks.uploadBytes,
  getDownloadURL: mocks.getDownloadURL,
}));

vi.mock("./firebase", () => ({
  storage: mocks.storage,
}));

import { uploadPostImage } from "./mediaStorage";

describe("uploadPostImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads an image and returns its download URL", async () => {
    const file = new File(
      ["image-data"],
      "vacation.jpg",
      {
        type: "image/jpeg",
      },
    );

    const imageRef = {
      fullPath: "post-images/user-123/image.jpg",
    };

    const uploadedRef = {
      fullPath: "post-images/user-123/image.jpg",
    };

    mocks.ref.mockReturnValue(imageRef);

    mocks.uploadBytes.mockResolvedValue({
      ref: uploadedRef,
    });

    mocks.getDownloadURL.mockResolvedValue(
      "https://example.com/vacation.jpg",
    );

    const result = await uploadPostImage(
      file,
      "user-123",
    );

    expect(mocks.ref).toHaveBeenCalledTimes(1);

    expect(mocks.ref).toHaveBeenCalledWith(
      mocks.storage,
      expect.stringContaining(
        "post-images/user-123/",
      ),
    );

    expect(mocks.uploadBytes).toHaveBeenCalledWith(
      imageRef,
      file,
      {
        contentType: "image/jpeg",
      },
    );

    expect(mocks.getDownloadURL).toHaveBeenCalledWith(
      uploadedRef,
    );

    expect(result).toBe(
      "https://example.com/vacation.jpg",
    );
  });

  it("preserves upload failures", async () => {
    const file = new File(
      ["image-data"],
      "vacation.jpg",
      {
        type: "image/jpeg",
      },
    );

    const imageRef = {
      fullPath: "post-images/user-123/image.jpg",
    };

    const uploadError = new Error(
      "Upload failed",
    );

    mocks.ref.mockReturnValue(imageRef);

    mocks.uploadBytes.mockRejectedValue(
      uploadError,
    );

    await expect(
      uploadPostImage(
        file,
        "user-123",
      ),
    ).rejects.toBe(uploadError);

    expect(
      mocks.getDownloadURL,
    ).not.toHaveBeenCalled();
  });

  it("returns the download URL after upload succeeds", async () => {
    const file = new File(
      ["image-data"],
      "photo.png",
      {
        type: "image/png",
      },
    );

    const imageRef = {
      fullPath: "post-images/user-456/photo.png",
    };

    mocks.ref.mockReturnValue(imageRef);

    mocks.uploadBytes.mockResolvedValue({
      ref: imageRef,
    });

    mocks.getDownloadURL.mockResolvedValue(
      "https://example.com/photo.png",
    );

    const result = await uploadPostImage(
      file,
      "user-456",
    );

    expect(result).toBe(
      "https://example.com/photo.png",
    );
  });
});