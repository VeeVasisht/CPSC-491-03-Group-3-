export interface MediaValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function validateMedia(
  file: File,
): MediaValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Unsupported image type.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "Image is too large.",
    };
  }

  return {
    valid: true,
  };
}