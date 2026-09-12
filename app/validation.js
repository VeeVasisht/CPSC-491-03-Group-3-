const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'video/mp4'];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_VIDEO_SIZE_MB = 50;
const MAX_VIDEO_DURATION_SEC = 30:
const MAX_CAPTION_LENGTH = 2200;

export function validateEmail(email) {
  if (!email.trim()) {
    return "Email is required.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email.trim())) {
    return "Please enter a valid email address.";
  }

  return "";
}