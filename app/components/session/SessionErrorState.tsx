interface SessionErrorStateProps {
  message: string | null;
  onRetry: () => void;
}

export function SessionErrorState({
  message,
  onRetry,
}: SessionErrorStateProps) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <section className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold">
          Unable to load your session
        </h1>

        <p className="text-gray-600 dark:text-gray-300">
          {message ??
            "WeTravel could not determine your login status."}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-white font-medium hover:bg-blue-700"
        >
          Try Again
        </button>
      </section>
    </main>
  );
}
