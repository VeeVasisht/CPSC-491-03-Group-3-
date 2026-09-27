export function SessionLoadingScreen() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <section
        className="text-center space-y-3"
        aria-live="polite"
        aria-busy="true"
      >
        <h1 className="text-2xl font-semibold">
          WeTravel
        </h1>

        <p className="text-gray-600 dark:text-gray-300">
          Checking your session...
        </p>
      </section>
    </main>
  );
}
