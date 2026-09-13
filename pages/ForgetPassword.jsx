import { useState } from "react";
import { Link } from "react-router-dom";

import { resetPassword } from "../authService";
import { validateEmail } from "../validation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const validationError = validateEmail(email);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const result = await resetPassword(email);

    setLoading(false);

    if (result.success) {
      setMessage(result.message);
    } else {
      setError(result.message);
    }
  }

  return (
    <main>
      <section>
        <h1>Reset Your Password</h1>

        <p>
          Enter the email associated with your WeTravel
          account.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">
            Email Address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="traveler@example.com"
          />

          {error && <p>{error}</p>}
          {message && <p>{message}</p>}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Sending..."
              : "Send Reset Email"}
          </button>
        </form>

        <Link to="/login">
          Back to Login
        </Link>
      </section>
    </main>
  );
}