import { useState } from "react";
import { Link } from "react-router";

import { resetPassword } from "../firebase/auth";
import {
  validateForgetPasswordEmail,
  getResetPasswordErrorMessage
} from "../models/forgetPassword";


export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: { preventDefault: () => void; }) {
    event.preventDefault();
    setFieldError("");
    setFormError("");

    const validation = validateForgetPasswordEmail({ email });

    if (!validation.valid) {
      setFieldError(validation.error || "");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(email);
      setIsSuccess(true);
    } catch (error) {
      console.error("Password reset error:", error);
      setFormError(getResetPasswordErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Reset Password</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Enter your email to receive a password reset link.
          </p>
        </header>

        <form
          className="space-y-5 rounded-3xl border border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-800/50"
          onSubmit={handleSubmit}
          noValidate
        >
          {isSuccess ? (
            <div className="space-y-4">
              <div
                className="rounded-xl bg-green-50 p-4 text-sm text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                role="status"
              >
                Password reset link sent! Check your inbox for instructions.
              </div>
              <Link
                to="/login"
                className="block w-full text-center rounded-xl bg-blue-700 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Return to Log In
              </Link>
            </div>
          ) : (
            <>
              {formError && (
                <p
                  className="rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                  role="alert"
                >
                  {formError}
                </p>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />

                {fieldError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {fieldError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-700 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Sending link..." : "Send Reset Link"}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:underline dark:text-gray-400"
                >
                  Back to Log In
                </Link>
              </div>
            </>
          )}
        </form>
      </div>
    </main>
  );
}