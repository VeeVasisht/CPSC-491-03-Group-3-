export interface LoginFormValues {
  email: string;
  password: string;
}

export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

export interface LoginValidationResult {
  valid: boolean;
  errors: LoginFieldErrors;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginFields(
  values: LoginFormValues,
): LoginValidationResult {
  const errors: LoginFieldErrors = {};
  const email = values.email.trim();

  if (email.length === 0) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (values.password.length === 0) {
    errors.password = "Password is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getLoginErrorMessage(error: unknown): string {
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
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password.";

    case "auth/invalid-email":
      return "Enter a valid email address.";

    case "auth/user-disabled":
      return "This account has been disabled.";

    case "auth/too-many-requests":
      return "Too many login attempts. Please try again later.";

    case "auth/network-request-failed":
      return "Unable to connect. Check your internet connection and try again.";

    default:
      return "Unable to log in. Please try again.";
  }
}