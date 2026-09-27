import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  type Auth,
  type User,
} from "firebase/auth";

export type SessionChangeHandler = (user: User | null) => void;
export type SessionErrorHandler = (error: Error) => void;

export async function configureSessionPersistence(
  authInstance: Auth,
): Promise<void> {
  await setPersistence(
    authInstance,
    browserLocalPersistence,
  );
}

export function observeAuthSession(
  authInstance: Auth,
  onChange: SessionChangeHandler,
  onError: SessionErrorHandler,
): () => void {
  return onAuthStateChanged(
    authInstance,
    onChange,
    onError,
  );
}
