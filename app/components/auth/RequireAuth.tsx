import type { ReactNode } from "react";

import {
  Navigate,
  useLocation,
} from "react-router";

import { useAuthSession } from "../../session/AuthSessionContext";

import { SessionErrorState } from "../session/SessionErrorState";
import { SessionLoadingScreen } from "../session/SessionLoadingScreen";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({
  children,
}: RequireAuthProps) {
  const location = useLocation();

  const {
    status,
    error,
    retry,
  } = useAuthSession();

  if (status === "loading") {
    return <SessionLoadingScreen />;
  }

  if (status === "error") {
    return (
      <SessionErrorState
        message={error}
        onRetry={retry}
      />
    );
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <>{children}</>;
}
