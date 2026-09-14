import {
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router";

import { signIn } from "../firebase/auth";

import {
  getLoginErrorMessage,
  validateLoginFields,
  type LoginFieldErrors,
} from "../models/login";

export function LoginForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErrors, setFieldErrors] =
    useState<LoginFieldErrors>({});

  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validation = validateLoginFields({
      email,
      password,
    });

    setFieldErrors(validation.errors);
    setLoginError("");

    if (!validation.valid) {
      return;
    }

    setIsLoading(true);

    try {
      await signIn(email, password);

      navigate("/", {
        replace: true,
      });
    } catch (error) {
  console.error("Login error:", error);

  setLoginError(
    getLoginErrorMessage(error),
  );
} finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      className="space-y-5 rounded-3xl border border-gray-200 p-6 dark:border-gray-700"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium"
        >
          Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-xl border border-gray-300 px-3 py-2"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          disabled={isLoading}
        />

        {fieldErrors.email && (
          <p className="text-sm text-red-600">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium"
        >
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-xl border border-gray-300 px-3 py-2"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          disabled={isLoading}
        />

        {fieldErrors.password && (
          <p className="text-sm text-red-600">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {loginError && (
        <p
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {loginError}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-xl bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-60"
        disabled={isLoading}
      >
        {isLoading
          ? "Logging in..."
          : "Log In"}
      </button>
    </form>
  );
}