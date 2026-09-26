import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  validateGeotag,
  type Geotag,
} from "../../models/geotag";

interface LocationPickerProps {
  value: Geotag | null;
  onChange: (location: Geotag | null) => void;
}

export function LocationPicker({
  value,
  onChange,
}: LocationPickerProps) {
  const [name, setName] = useState(
    value?.name ?? "",
  );

  const [latitude, setLatitude] = useState(
    value ? String(value.latitude) : "",
  );

  const [longitude, setLongitude] = useState(
    value ? String(value.longitude) : "",
  );

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    setName(value?.name ?? "");
    setLatitude(
      value ? String(value.latitude) : "",
    );
    setLongitude(
      value ? String(value.longitude) : "",
    );
  }, [value]);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      name.trim() === "" ||
      latitude.trim() === "" ||
      longitude.trim() === ""
    ) {
      setError(
        "Enter a location, latitude, and longitude.",
      );
      return;
    }

    const location: Geotag = {
      name: name.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
    };

    const validation = validateGeotag(location);

    if (!validation.valid) {
      const validationError =
        validation.errors.name ??
        validation.errors.latitude ??
        validation.errors.longitude ??
        "Enter a valid location and coordinates.";

      setError(validationError);
      return;
    }

    setError(null);
    onChange(location);
  }

  function handleClear() {
    setName("");
    setLatitude("");
    setLongitude("");
    setError(null);
    onChange(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3"
    >
      <div>
        <label
          htmlFor="location-name"
          className="block text-sm font-medium"
        >
          Location
        </label>

        <input
          id="location-name"
          type="text"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          placeholder="Irvine, CA"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="latitude"
            className="block text-sm font-medium"
          >
            Latitude
          </label>

          <input
            id="latitude"
            type="number"
            step="any"
            value={latitude}
            onChange={(event) =>
              setLatitude(event.target.value)
            }
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700"
          />
        </div>

        <div>
          <label
            htmlFor="longitude"
            className="block text-sm font-medium"
          >
            Longitude
          </label>

          <input
            id="longitude"
            type="number"
            step="any"
            value={longitude}
            onChange={(event) =>
              setLongitude(event.target.value)
            }
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700"
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="text-sm text-red-600"
        >
          {error}
        </p>
      )}

      {value && (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Selected: {value.name}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white"
        >
          Add Location
        </button>

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
          >
            Remove
          </button>
        )}
      </div>
    </form>
  );
}
