// app/routes/profile.tsx

/**
 * Profile screen (P3 slice, Sprint 1).
 *
 * View + edit the signed-in user's profile. Handles every required state:
 * loading, loaded, missing profile, load error, editing, validation error,
 * saving, save success, save error. All Firestore access goes through
 * profileService — this component never touches Firestore directly.
 */

import { useEffect, useState } from "react";
import {
  getCurrentProfile,
  updateCurrentProfile,
} from "../services/profileService";
import {
  validateProfileFields,
  hasProfileChanges,
  type UserProfile,
  type UserProfileFormValues,
  type FieldErrors,
} from "../models/userProfile";

type ScreenState =
  | { kind: "loading" }
  | { kind: "loaded"; profile: UserProfile }
  | { kind: "not-found" }
  | { kind: "load-error"; message: string };

export default function Profile() {
  const [state, setState] = useState<ScreenState>({ kind: "loading" });
  const [editing, setEditing] = useState(false);

  // form state (only used while editing)
  const [form, setForm] = useState<UserProfileFormValues>({ displayName: "", bio: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load the profile on mount.
  async function load() {
    setState({ kind: "loading" });
    const result = await getCurrentProfile();
    if (result.status === "ok") {
      setState({ kind: "loaded", profile: result.profile });
    } else if (result.status === "not-found") {
      setState({ kind: "not-found" });
    } else {
      setState({ kind: "load-error", message: result.message });
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEditing(profile: UserProfile) {
    setForm({ displayName: profile.displayName, bio: profile.bio });
    setErrors({});
    setSaveError("");
    setSaveSuccess(false);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setErrors({});
    setSaveError("");
  }

  async function handleSave(current: UserProfile) {
    // validate before any write
    const result = validateProfileFields(form);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    setSaveError("");

    const update = await updateCurrentProfile(form);
    setSaving(false);

    if (update.status === "ok") {
      // reflect saved values locally and leave edit mode
      setState({
        kind: "loaded",
        profile: {
          ...current,
          displayName: form.displayName.trim(),
          bio: form.bio.trim(),
          updatedAt: Date.now(),
        },
      });
      setEditing(false);
      setSaveSuccess(true);
    } else {
      setSaveError(update.message); // keep the user's edits so they can retry
    }
  }

  // ---- Render by state ----

  if (state.kind === "loading") {
    return <main><p>Loading your profile…</p></main>;
  }

  if (state.kind === "load-error") {
    return (
      <main>
        <p>{state.message}</p>
        <button onClick={load}>Retry</button>
      </main>
    );
  }

  if (state.kind === "not-found") {
    return (
      <main>
        <h1>No profile yet</h1>
        <p>We couldn't find a profile for your account.</p>
      </main>
    );
  }

  // state.kind === "loaded"
  const { profile } = state;

  if (!editing) {
    return (
      <main>
        <h1>Profile</h1>
        {saveSuccess && <p>Profile updated.</p>}
        <p><strong>Display name:</strong> {profile.displayName}</p>
        <p><strong>Bio:</strong> {profile.bio || "—"}</p>
        <button onClick={() => startEditing(profile)}>Edit Profile</button>
      </main>
    );
  }

  // editing
  const changed = hasProfileChanges(
    { displayName: profile.displayName, bio: profile.bio },
    form
  );
  const validation = validateProfileFields(form);
  const saveDisabled = saving || !changed || !validation.valid;

  return (
    <main>
      <h1>Edit Profile</h1>

      <label htmlFor="displayName">Display name</label>
      <input
        id="displayName"
        value={form.displayName}
        onChange={(e) => setForm({ ...form, displayName: e.target.value })}
      />
      {errors.displayName && <p>{errors.displayName}</p>}

      <label htmlFor="bio">Bio</label>
      <textarea
        id="bio"
        value={form.bio}
        onChange={(e) => setForm({ ...form, bio: e.target.value })}
      />
      {errors.bio && <p>{errors.bio}</p>}

      {saveError && <p>{saveError}</p>}

      <button onClick={() => handleSave(profile)} disabled={saveDisabled}>
        {saving ? "Saving…" : "Save"}
      </button>
      <button onClick={cancelEditing} disabled={saving}>Cancel</button>
    </main>
  );
}