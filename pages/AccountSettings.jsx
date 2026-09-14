import { Link } from "react-router";

export default function AccountSettings() {
  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 py-10 space-y-8">
      <header className="border-b border-gray-200 pb-4 dark:border-gray-700">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Manage your account credentials and security preferences.
        </p>
      </header>

      <section className="space-y-6">
        <div className="rounded-2xl border border-gray-200 p-6 space-y-4 dark:border-gray-700 dark:bg-gray-800/40">
          <h2 className="text-xl font-semibold">Security & Password</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Need to update your password? You can trigger a secure reset link to your email address.
          </p>
          <Link
            to="/forget-password"
            className="inline-block rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Reset Password via Email
          </Link>
        </div>
      </section>
    </main>
  );
}