// app/profile/Profile.tsx

/**
 * Profile component (P3 slice, Sprint 1).
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
  DISPLAY_NAME_MAX,
  BIO_MAX,
} from "../models/userProfile";
import type { FeedPost } from "../models/feed";
import { getPostsByAuthor } from "../services/userPostsService";
import { ProfilePostGrid } from "../components/profile/ProfilePostGrid";

const pageClass = "mx-auto max-w-3xl px-6 py-12";
const cardClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-800";
const primaryButton =
  "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700";
const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-2 focus:outline-blue-500/40 dark:border-gray-600 dark:bg-gray-900 dark:text-white";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-200";
const errorText = "mt-1 text-sm text-red-600 dark:text-red-400";

/** First letters of up to two words in the name, for the avatar circle. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

type ScreenState =
  | { kind: "loading" }
  | { kind: "loaded"; profile: UserProfile }
  | { kind: "not-found" }
  | { kind: "load-error"; message: string };

export function Profile() {
  const [state, setState] = useState<ScreenState>({ kind: "loading" });
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState<UserProfileFormValues>({ displayName: "", bio: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // The user's own posts, shown as a grid under the profile card.
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [postsError, setPostsError] = useState("");

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

  async function loadPosts(uid: string) {
    setPosts(null);
    setPostsError("");
    try {
      setPosts(await getPostsByAuthor(uid));
    } catch {
      setPostsError("Couldn't load your posts. Please try again.");
    }
  }

  const loadedUid = state.kind === "loaded" ? state.profile.uid : null;
  useEffect(() => {
    if (loadedUid) loadPosts(loadedUid);
  }, [loadedUid]);

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
      setSaveError(update.message);
    }
  }

  if (state.kind === "loading") {
    return (
      <main className={pageClass}>
        <p className="text-gray-600 dark:text-gray-400">Loading your profile…</p>
      </main>
    );
  }

  if (state.kind === "load-error") {
    return (
      <main className={pageClass}>
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          <p>{state.message}</p>
          <button onClick={load} className={`${primaryButton} mt-4`}>
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (state.kind === "not-found") {
    return (
      <main className={pageClass}>
        <div className={cardClass}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            No profile yet
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            We couldn't find a profile for your account.
          </p>
        </div>
      </main>
    );
  }

  const { profile } = state;

  if (!editing) {
    return (
      <main className={pageClass}>
        {saveSuccess && (
          <p
            role="status"
            className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200"
          >
            Profile updated.
          </p>
        )}

        <section className={cardClass}>
          <div className="flex flex-wrap items-center gap-5">
            <div
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-blue-50 text-2xl font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            >
              {initials(profile.displayName)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Profile</p>
              <h1 className="text-2xl font-bold break-words sm:text-3xl text-gray-900 dark:text-white">
                {profile.displayName}
              </h1>
              {posts && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {posts.length}
                  </span>{" "}
                  {posts.length === 1 ? "post" : "posts"}
                </p>
              )}
            </div>

            <button
              onClick={() => startEditing(profile)}
              className={`${secondaryButton} w-full sm:w-auto`}
            >
              Edit profile
            </button>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bio</h2>
            {profile.bio ? (
              <p className="mt-1 whitespace-pre-line text-gray-800 dark:text-gray-200">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                No bio yet. Add one so other travelers know who you are.
              </p>
            )}
          </div>
        </section>

        <section aria-labelledby="posts-heading" className="mt-10">
          <h2
            id="posts-heading"
            className="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            Posts
          </h2>
          {postsError ? (
            <div role="alert" className="text-sm text-red-600 dark:text-red-400">
              <p>{postsError}</p>
              <button
                onClick={() => loadPosts(profile.uid)}
                className={`${secondaryButton} mt-3`}
              >
                Retry
              </button>
            </div>
          ) : posts === null ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading posts…</p>
          ) : (
            <ProfilePostGrid posts={posts} authorName={profile.displayName} />
          )}
        </section>
      </main>
    );
  }

  const changed = hasProfileChanges(
    { displayName: profile.displayName, bio: profile.bio },
    form
  );
  const validation = validateProfileFields(form);
  const saveDisabled = saving || !changed || !validation.valid;

  return (
    <main className={pageClass}>
      <section className={cardClass}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit profile</h1>

        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <label htmlFor="displayName" className={labelClass}>
              Display name
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {form.displayName.length}/{DISPLAY_NAME_MAX}
            </span>
          </div>
          <input
            id="displayName"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            aria-invalid={Boolean(errors.displayName)}
            className={inputClass}
          />
          {errors.displayName && <p className={errorText}>{errors.displayName}</p>}
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="bio" className={labelClass}>
              Bio
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {form.bio.length}/{BIO_MAX}
            </span>
          </div>
          <textarea
            id="bio"
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            aria-invalid={Boolean(errors.bio)}
            className={`${inputClass} resize-y`}
          />
          {errors.bio && <p className={errorText}>{errors.bio}</p>}
        </div>

        {saveError && (
          <p role="alert" className={`${errorText} mt-4`}>
            {saveError}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => handleSave(profile)}
            disabled={saveDisabled}
            className={primaryButton}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={cancelEditing} disabled={saving} className={secondaryButton}>
            Cancel
          </button>
        </div>
      </section>
    </main>
  );
}
