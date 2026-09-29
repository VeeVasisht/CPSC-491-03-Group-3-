import {
  describe,
  expect,
  it,
} from "vitest";

import { validateMedia } from "./media";

describe("validateMedia", () => {
  it("accepts a valid JPEG image", () => {
    const file = new File(
      ["image-data"],
      "vacation.jpg",
      {
        type: "image/jpeg",
      },
    );

    const result = validateMedia(file);

    expect(result.valid).toBe(true);
  });

  it("rejects unsupported files", () => {
    const file = new File(
      ["document-data"],
      "document.pdf",
      {
        type: "application/pdf",
      },
    );

    const result = validateMedia(file);

    expect(result.valid).toBe(false);
    expect(result.error).toBe(
      "Unsupported image type.",
    );
  });
});