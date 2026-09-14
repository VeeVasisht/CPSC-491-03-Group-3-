import { useState } from "react";

import { Link } from "react-router";

import { signOut } from "../../firebase/auth";

import { useAuthSession } from "../../session/AuthSessionContext";

export function MainNav() {
  const { user } = useAuthSession();

  const [logoutError, setLogoutError] =
    useState<string | null>(null);

  const [loggingOut, setLoggingOut] =
    useState(false);

  async function handleLogout() {
    setLogoutError(null);
    setLoggingOut(true);

    try {
      await signOut();

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign out.";

      setLogoutError(message);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link
          to="/"
          className="font-semibold text-xl"
        >
          WeTravel
        </Link>

        <div className="flex items-center gap-4">
          {user?.email && (
            <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">
              {user.email}
            </span>
          )}

          <button
            type="button"
            disabled={loggingOut}
            onClick={() => {
              void handleLogout();
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-gray-700"
          >
            {loggingOut
              ? "Signing out..."
              : "Sign Out"}
          </button>
        </div>
      </nav>

      {logoutError && (
        <p
          role="alert"
          className="container mx-auto px-4 pb-3 text-sm text-red-600"
        >
          {logoutError}
        </p>
      )}
    </header>
  );
}
