import {
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase/config";

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email.trim());

    return {
      success: true,
      message:
        "If an account exists for this email, reset instructions have been sent.",
    };
  } catch (error) {
    switch (error.code) {
      case "auth/invalid-email":
        return {
          success: false,
          message: "The email address is invalid.",
        };

      case "auth/too-many-requests":
        return {
          success: false,
          message:
            "Too many attempts. Please wait and try again.",
        };

      case "auth/network-request-failed":
        return {
          success: false,
          message:
            "Network error. Please check your connection.",
        };

      default:
        return {
          success: false,
          message:
            "Unable to send the reset email. Please try again.",
        };
    }
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      message: "Unable to sign out.",
    };
  }
}