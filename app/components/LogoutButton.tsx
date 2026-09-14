import { useState } from "react";
import { useNavigate } from "react-router";

import { signOut } from "../firebase/auth";

export function LogoutButton() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setLogoutError("");
    setIsLoading(true);

    try {
      await signOut();

      navigate("/login", {
        replace: true,
      });
    } catch {
      setLogoutError(
        "Unable to log out. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className="w-full rounded-xl border border-gray-300 px-4 py-2 font-medium disabled:opacity-60"
      >
        {isLoading ? "Logging out..." : "Log Out"}
      </button>

      {logoutError && (
        <p
          className="text-sm text-red-600"
          role="alert"
        >
          {logoutError}
        </p>
      )}
    </div>
  );
}