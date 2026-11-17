import { useEffect, useState } from "react";

export function OfflineItineraryStatus({ cached }: { cached: boolean }) {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <p role="status" aria-live="polite" className="rounded border p-2 text-sm">
      {online
        ? "Online — saved trips can be refreshed from Firestore."
        : cached
          ? "Offline — showing saved trip details from this browser. Map tiles may not load."
          : "Offline — no saved trip data is available on this browser."}
    </p>
  );
}
