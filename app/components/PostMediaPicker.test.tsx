import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { PostMediaPicker } from "./PostMediaPicker";

const mocks = vi.hoisted(() => ({
  uploadPostImage: vi.fn(),
}));

vi.mock("../firebase/mediaStorage", () => ({
  uploadPostImage: mocks.uploadPostImage,
}));

vi.mock("../firebase/firebase", () => ({
  auth: {
    currentUser: {
      uid: "user-123",
    },
  },
}));

describe("PostMediaPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test-preview"),
    });
  });

  it("uploads a selected image successfully", async () => {
    mocks.uploadPostImage.mockResolvedValue(
      "https://example.com/image.jpg",
    );

    const onUploadComplete = vi.fn();

    render(
      <PostMediaPicker
        onUploadComplete={onUploadComplete}
      />,
    );

    const file = new File(
      ["image-data"],
      "vacation.jpg",
      {
        type: "image/jpeg",
      },
    );

    const input = screen.getByLabelText(
      "Select Image",
    );

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Upload Image",
      }),
    );

    await waitFor(() => {
      expect(
        mocks.uploadPostImage,
      ).toHaveBeenCalledWith(
        file,
        "user-123",
      );
    });

    expect(
      onUploadComplete,
    ).toHaveBeenCalledWith(
      "https://example.com/image.jpg",
    );

    expect(
      screen.getByText("Upload successful."),
    ).toBeTruthy();
  });

  it("shows retry when upload fails", async () => {
    mocks.uploadPostImage.mockRejectedValueOnce(
      new Error("Upload failed"),
    );

    render(<PostMediaPicker />);

    const file = new File(
      ["image-data"],
      "vacation.jpg",
      {
        type: "image/jpeg",
      },
    );

    fireEvent.change(
      screen.getByLabelText("Select Image"),
      {
        target: {
          files: [file],
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Upload Image",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "Image upload failed. Please try again.",
        ),
      ).toBeTruthy();
    });

    expect(
      screen.getByRole("button", {
        name: "Retry Upload",
      }),
    ).toBeTruthy();
  });

  it("retries a failed upload", async () => {
    mocks.uploadPostImage
      .mockRejectedValueOnce(
        new Error("Upload failed"),
      )
      .mockResolvedValueOnce(
        "https://example.com/retry.jpg",
      );

    render(<PostMediaPicker />);

    const file = new File(
      ["image-data"],
      "retry.jpg",
      {
        type: "image/jpeg",
      },
    );

    fireEvent.change(
      screen.getByLabelText("Select Image"),
      {
        target: {
          files: [file],
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Upload Image",
      }),
    );

    await screen.findByRole("button", {
      name: "Retry Upload",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Retry Upload",
      }),
    );

    await waitFor(() => {
      expect(
        mocks.uploadPostImage,
      ).toHaveBeenCalledTimes(2);
    });

    expect(
      screen.getByText("Upload successful."),
    ).toBeTruthy();
  });

  it("prevents duplicate upload after success", async () => {
    mocks.uploadPostImage.mockResolvedValue(
      "https://example.com/image.jpg",
    );

    render(<PostMediaPicker />);

    const file = new File(
      ["image-data"],
      "vacation.jpg",
      {
        type: "image/jpeg",
      },
    );

    fireEvent.change(
      screen.getByLabelText("Select Image"),
      {
        target: {
          files: [file],
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Upload Image",
      }),
    );

    await screen.findByText(
      "Upload successful.",
    );

    const uploadedButton =
      screen.getByRole("button", {
        name: "Uploaded",
      });

    expect(
  (uploadedButton as HTMLButtonElement).disabled,
).toBe(true);
    expect(
      mocks.uploadPostImage,
    ).toHaveBeenCalledTimes(1);
  });
});