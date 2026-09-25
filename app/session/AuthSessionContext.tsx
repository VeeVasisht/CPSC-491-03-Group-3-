import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { User } from "firebase/auth";

import { auth } from "../firebase/firebase";

import {
  configureSessionPersistence,
  observeAuthSession,
} from "./sessionService";

import type { SessionStatus } from "./sessionRouting";

interface AuthSessionContextValue {
  user: User | null;
  status: SessionStatus;
  error: string | null;
  retry: () => void;
}

const AuthSessionContext =
  createContext<AuthSessionContextValue | undefined>(
    undefined,
  );

interface AuthSessionProviderProps {
  children: ReactNode;
}

export function AuthSessionProvider({
  children,
}: AuthSessionProviderProps) {
  const [user, setUser] =
    useState<User | null>(null);

  const [status, setStatus] =
    useState<SessionStatus>("loading");

  const [error, setError] =
    useState<string | null>(null);

  const [attempt, setAttempt] =
    useState(0);

  const retry = useCallback(() => {
    setUser(null);
    setError(null);
    setStatus("loading");
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    async function initializeSession() {
      setStatus("loading");
      setError(null);

      try {
        await configureSessionPersistence(auth);

        if (!active) {
          return;
        }

        unsubscribe = observeAuthSession(
          auth,

          (nextUser) => {
            if (!active) {
              return;
            }

            setUser(nextUser);
            setError(null);

            setStatus(
              nextUser
                ? "authenticated"
                : "unauthenticated",
            );
          },

          (sessionError) => {
            if (!active) {
              return;
            }

            setUser(null);
            setStatus("error");
            setError(
              sessionError.message ||
                "Unable to determine your session.",
            );
          },
        );
      } catch (sessionError) {
        if (!active) {
          return;
        }

        const message =
          sessionError instanceof Error
            ? sessionError.message
            : "Unable to initialize authentication.";

        setUser(null);
        setStatus("error");
        setError(message);
      }
    }

    void initializeSession();

    return () => {
      active = false;

      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [attempt]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      user,
      status,
      error,
      retry,
    }),
    [
      user,
      status,
      error,
      retry,
    ],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  const context =
    useContext(AuthSessionContext);

  if (!context) {
    throw new Error(
      "useAuthSession must be used inside AuthSessionProvider.",
    );
  }

  return context;
}
