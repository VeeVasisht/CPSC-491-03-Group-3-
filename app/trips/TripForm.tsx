import { useState } from "react";
import type { FormEvent } from "react";
import type { TripInput } from "./trip";
import { validateTrip } from "./tripValidation";

const EMPTY: TripInput = { title: "", description: "", destination: "", startDate: "", endDate: "" };

interface Props {
  initial?: TripInput;
  submitLabel?: string;
  onSubmit: (input: TripInput) => Promise<void>;
  onCancel: () => void;
}

export function TripForm({ initial = EMPTY, submitLabel = "Save trip", onSubmit, onCancel }: Props) {
  const [input, setInput] = useState<TripInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const field = (name: keyof TripInput) => ({
    value: input[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setInput((current) => ({ ...current, [name]: event.target.value })),
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit(validateTrip(input));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the trip.");
    } finally {
      setSaving(false);
    }
  }

  const classes = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white";
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">Title <span aria-hidden="true">*</span>
        <input {...field("title")} maxLength={100} required className={classes} />
      </label>
      <label className="block">Destination <span aria-hidden="true">*</span>
        <input {...field("destination")} maxLength={150} required className={classes} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">Start date <input {...field("startDate")} type="date" required className={classes} /></label>
        <label className="block">End date <input {...field("endDate")} type="date" min={input.startDate || undefined} required className={classes} /></label>
      </div>
      <label className="block">Description
        <textarea {...field("description")} maxLength={2000} rows={4} className={classes} />
      </label>
      {error && <p role="alert" className="text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-3">
        <button disabled={saving} type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{saving ? "Saving…" : submitLabel}</button>
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2">Cancel</button>
      </div>
    </form>
  );
}
