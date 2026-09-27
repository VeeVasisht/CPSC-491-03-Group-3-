export type SessionStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

export type SessionDestination = "/" | "/login" | null;

export function getSessionDestination(
  status: SessionStatus,
): SessionDestination {
  switch (status) {
    case "authenticated":
      return "/";

    case "unauthenticated":
      return "/login";

    case "loading":
    case "error":
    default:
      return null;
  }
}
