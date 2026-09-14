const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'video/mp4'];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_VIDEO_SIZE_MB = 50;
const MAX_VIDEO_DURATION_SEC = 30;
const MAX_CAPTION_LENGTH = 2200;


/* Validates Email address as stated by making sure that the email patter is
mainted and that the correct type of data is used as input.
 * @param {string}
 * @returns {{ valid: boolean, error?: string}}
 */

export function validateEmail(email: unknown) : { valid: boolean; error?: string } {
  if (!email || typeof email != 'string') {
    return { valid: false, error: 'Email is required.' };
  }

  const trimmed = email.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }

  return { valid: true };
};