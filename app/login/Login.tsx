import { useState, type SubmitEvent } from "react";
import {
  GoogleAuthProvider,
  reload,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { auth } from "../firebase/firebase";
import { ensureUserProfile } from "../firebase/auth";

function loginError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was canceled.";
    case "auth/popup-blocked":
      return "Your browser blocked Google sign-in. Allow popups and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Unable to sign in. Please try again.";
  }
}

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setNotice(null);
    setSubmitting(true);

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      // Refresh the user in case email verification happened in another tab.
      await reload(credential.user);
      if (!credential.user.emailVerified) {
        await signOut(auth);
        setError(
          "Please verify your email before logging in. Check your inbox or the Auth emulator terminal for the verification link.",
        );
        return;
      }

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      setError(loginError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    if (submitting) return;
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureUserProfile(credential.user);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError(loginError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    if (submitting) return;
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Enter your email address first to reset your password.");
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice(
        "If an account exists for that email, password reset instructions have been sent. In the emulator, check the terminal for the link.",
      );
    } catch (err) {
      console.error("Password reset failed:", err);
      setError(loginError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="registration-page">
      <section className="registration-card">
        <header className="registration-header">
          <h1>Welcome back to WeTravel</h1>
          <p>Log in to continue planning your next trip.</p>
        </header>

        <div className="registration-auth">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full rounded-lg border border-gray-400 p-3 font-medium hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
          >
            Continue with Google
          </button>

          <div className="registration-divider">
            <span>or</span>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-md border border-gray-400 bg-transparent p-2"
              />
            </label>

            <div className="registration-field">
              <label htmlFor="login-password">Password</label>
              <div className="relative w-full">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="block w-full rounded-md border border-gray-400 bg-transparent px-3 py-2 pr-12 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-3 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={submitting}
              className="self-end text-sm underline hover:opacity-80 disabled:opacity-50"
            >
              Forgot password?
            </button>

            {error && (
              <p
                role="alert"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {error}
              </p>
            )}
            {notice && (
              <p
                role="status"
                className="text-sm text-green-700 dark:text-green-400"
              >
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-800 p-3 font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
            >
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>

        <footer className="registration-footer">
          <p>
            Don't have an account? <Link to="/registration">Sign up</Link>
          </p>
        </footer>
      </section>
    </main>
  );
}
