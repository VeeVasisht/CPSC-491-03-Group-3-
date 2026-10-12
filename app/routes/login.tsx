import { PublicOnly } from "../components/auth/PublicOnly";
import { LoginForm } from "../components/LoginForm";
import { Link } from "react-router";
import type { Route } from "./+types/login";

export function meta({}: Route.MetaArgs) {
  return [
    {
      title: "Login | WeTravel",
    },
    {
      name: "description",
      content: "Login to your account",
    },
  ];
}

export default function Login() {
  return (
    <PublicOnly>
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          <header className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold">
              WeTravel
            </h1>

            <h2 className="text-xl font-medium">
              Sign In
            </h2>

            <p className="text-gray-600 dark:text-gray-300">
              Log in to continue.
            </p>
          </header>

          <LoginForm />

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                to="/registration"
                className="underline"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </main>
    </PublicOnly>
  );
}