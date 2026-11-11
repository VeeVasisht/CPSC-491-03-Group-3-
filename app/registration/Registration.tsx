import { useEffect, useState, type SubmitEvent } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithPopup,
  updateProfile,
  reload,
  validatePassword,
  type PasswordValidationStatus,
} from "firebase/auth";
import { useNavigate } from "react-router";

import { auth } from "../firebase/firebase";
import { ensureUserProfile } from "../firebase/auth";
import { validateLocalPassword } from "./passwordValidation";
import { Eye, EyeOff } from "lucide-react";

function passwordPolicyError(status: PasswordValidationStatus): string {
  const missing: string[] = [];

  if (status.meetsMinPasswordLength === false)
    missing.push("a longer password");
  if (status.meetsMaxPasswordLength === false)
    missing.push("a shorter password");
  if (status.containsLowercaseLetter === false)
    missing.push("a lowercase letter");
  if (status.containsUppercaseLetter === false)
    missing.push("an uppercase letter");
  if (status.containsNumericCharacter === false) missing.push("a number");
  if (status.containsNonAlphanumericCharacter === false)
    missing.push("a special character");

  return missing.length
    ? `Password must include ${missing.join(", ")}.`
    : "Password does not meet the Firebase password policy.";
}

function authenticationError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Password does not meet the Firebase password policy.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was canceled.";
    case "auth/popup-blocked":
      return "Your browser blocked Google sign-in. Allow popups and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Unable to complete registration. Please try again.";
  }
}

export function Registration() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  useEffect(() => {
    if (!awaitingVerification) return;

    let cancelled = false;
    let checking = false;

    async function checkVerification() {
      const user = auth.currentUser;
      if (!user || checking || cancelled) return;

      checking = true;
      try {
        // Refresh Auth state: emailVerified does not update automatically
        // when the verification link is opened in another browser tab.
        await reload(user);
        if (!cancelled && user.emailVerified) {
          navigate("/", { replace: true });
        }
      } catch (err) {
        // A temporary emulator/network failure should not end polling.
        console.error("Email verification check failed:", err);
      } finally {
        checking = false;
      }
    }

    void checkVerification();
    const interval = window.setInterval(() => void checkVerification(), 3000);
    window.addEventListener("focus", checkVerification);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", checkVerification);
    };
  }, [awaitingVerification, navigate]);

  async function handleSignUp(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    setNotice(null);

    const trimmedName = displayName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setError("Display name must be between 2 and 50 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    let newUser: import("firebase/auth").User | null = null;
    let profileCreated = false;
    try {
      if (auth.emulatorConfig !== null) {
        // The Auth emulator does not support validatePassword().
        const localErrors = validateLocalPassword(password);

        if (localErrors.length > 0) {
          setError(localErrors.join(" "));
          return;
        }
      } else {
        // Production: validate against the Firebase project's password policy.
        const policy = await validatePassword(auth, password);

        if (!policy.isValid) {
          setError(passwordPolicyError(policy));
          return;
        }
      }

      const errors = validateLocalPassword(password);

      if (errors.length > 0) {
        setError(errors.join(" "));
        return;
      }

      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      newUser = credential.user;
      // Set Auth displayName before creating the Firestore user profile.
      await updateProfile(newUser, { displayName: trimmedName });
      await ensureUserProfile(newUser);
      profileCreated = true;

      try {
        await sendEmailVerification(newUser);
        setNotice("Account created. Check your email for a verification link.");
      } catch {
        setNotice(
          "Account created, but the verification email could not be sent. You can request another later.",
        );
      }
      // Keep the form visible and check verification until redirecting home.
      setAwaitingVerification(true);
    } catch (err) {
      console.error("Registration failed:", err);
      if (newUser && !profileCreated) {
        try {
          await deleteUser(newUser);
        } catch {
          // A retry or manual cleanup may be needed if deletion fails.
        }
      }
      setError(authenticationError(err));
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
      navigate("/");
    } catch (err) {
      setError(authenticationError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="registration-page">
      <section className="registration-card">
        <header className="registration-header">
          <h1>Join WeTravel</h1>
          <p>Create an account and start planning your next trip.</p>
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

          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span>Display name</span>
              <input
                type="text"
                autoComplete="nickname"
                required
                minLength={2}
                maxLength={50}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Enter your display name"
                className="rounded-md border border-gray-400 bg-transparent p-2"
              />
            </label>

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
    <label htmlFor="password">Password</label>

    <div className="relative w-full">
        <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            placeholder="Enter your password"
            className="
                block w-full rounded-md border border-gray-400
                bg-transparent px-3 py-2 pr-12
                text-white placeholder:text-gray-400
                focus:border-blue-400 focus:outline-none
                focus:ring-1 focus:ring-blue-400
            "
        />

        <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="
                absolute inset-y-0 right-3
                flex items-center justify-center
                text-gray-400 hover:text-white
            "
        >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
    </div>
</div>

            <label className="flex flex-col gap-1">
              <span>Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="rounded-md border border-gray-400 bg-transparent p-2"
              />
            </label>

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
              {awaitingVerification && (
                <span className="block mt-1">Once you verify your email, this page will automatically take you home.</span>
              )}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || notice !== null}
              className="rounded-md bg-blue-800 p-3 font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
            >
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <footer className="registration-footer">
          <p>
            Already have an account? <a href="/login">Log in</a>
          </p>
        </footer>
      </section>
    </main>
  );
}
