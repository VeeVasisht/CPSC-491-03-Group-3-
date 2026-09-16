import { PublicOnly } from "../components/auth/PublicOnly";
import { Link } from "react-router";

export default function Login() {
  return (
    <PublicOnly>
      <main className="min-h-screen flex items-center justify-center px-6">
        <section className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-3xl font-semibold">WeTravel</h1>

          <h2 className="text-xl font-medium">Sign In</h2>

          <p className="text-gray-600 dark:text-gray-300">
            Authentication screen integration is ready.
          </p>

          <p className="text-sm text-gray-500">
            The Sprint 1 login form will be connected here through the team's
            Login & Logout vertical slice.
          </p>

          <h2 className="text-xl font-medium">Don't Have An Account?</h2>
          <Link to="/registration"> Register</Link>
        </section>
      </main>
    </PublicOnly>
  );
}
