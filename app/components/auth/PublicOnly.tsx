import type { ReactNode } from "react";

import { Navigate } from "react-router";

import { useAuthSession } from "../../session/AuthSessionContext";

import { SessionErrorState } from "../session/SessionErrorState";
import { SessionLoadingScreen } from "../session/SessionLoadingScreen";

interface PublicOnlyProps {
  children: ReactNode;
}

export function PublicOnly({
  children,
}: PublicOnlyProps) {
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

  if (status === "authenticated") {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <>{children}</>;
}
