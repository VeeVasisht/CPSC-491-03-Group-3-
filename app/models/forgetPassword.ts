export interface ForgetPasswordFormValues {
  email: string;
}

export interface ForgetPasswordValidationResult {
  valid: boolean;
  error?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates the email address entered into the Password Reset form.
 */
export function validateForgetPasswordEmail(
  values: ForgetPasswordFormValues,
): ForgetPasswordValidationResult {
  const email = values.email.trim();

  if (email.length === 0) {
    return { valid: false, error: "Email address is required." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { valid: false, error: "Enter a valid email address." };
  }

  return { valid: true };
}

/**
 * Maps Firebase Auth error codes to user-friendly messages for password reset.
 */
export function getResetPasswordErrorMessage(error: unknown): string {
  let code = "";

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    code = error.code;
  }

  switch (code) {
    case "auth/user-not-found":
      return "No account found with this email address.";

    case "auth/invalid-email":
      return "Enter a valid email address.";

    case "auth/too-many-requests":
      return "Too many requests. Please try again later.";

    case "auth/network-request-failed":
      return "Unable to connect. Check your internet connection and try again.";

    default:
      return "Unable to send reset email. Please try again.";
  }
}