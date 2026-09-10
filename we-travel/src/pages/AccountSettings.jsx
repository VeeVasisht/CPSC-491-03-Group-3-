import { useNavigate } from "react-router-dom";

import { logoutUser } from "../services/authService";

export default function AccountSettings() {
  const navigate = useNavigate();

  async function handleLogout() {
    const result = await logoutUser();

    if (result.success) {
      navigate("/login");
    }
  }

  return (
    <main>
      <section>
        <h1>Account Settings</h1>

        <button
          onClick={() =>
            navigate("/forgot-password")
          }
        >
          Change Password
        </button>

        <button>
          Privacy
        </button>

        <button>
          Notifications
        </button>

        <button onClick={handleLogout}>
          Sign Out
        </button>
      </section>
    </main>
  );
}