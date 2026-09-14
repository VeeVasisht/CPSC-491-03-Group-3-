import type { Route } from "./+types/login";

import { LoginForm } from "../components/LoginForm";

export function meta({}: Route.MetaArgs) {
  return [
    {
      title: "Log In | WeTravel",
    },
    {
      name: "description",
      content: "Log in to WeTravel.",
    },
  ];
}

export default function Login() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">
            WeTravel
          </h1>

          <p className="text-gray-600 dark:text-gray-300">
            Log in to continue.
          </p>
        </header>

        <LoginForm />
      </div>
    </main>
  );
}