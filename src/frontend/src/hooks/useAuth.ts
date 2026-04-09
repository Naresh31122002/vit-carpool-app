import { useInternetIdentity } from "@caffeineai/core-infrastructure";

export type AuthStatus =
  | "initializing"
  | "authenticated"
  | "unauthenticated"
  | "logging-in"
  | "error";

export interface AuthState {
  status: AuthStatus;
  isAuthenticated: boolean;
  isInitializing: boolean;
  userId: string | null;
  login: () => void;
  logout: () => void;
}

export function useAuth(): AuthState {
  const { identity, login, clear, loginStatus, isInitializing } =
    useInternetIdentity();

  const isAuthenticated = !!identity;
  const userId = identity ? identity.getPrincipal().toText() : null;

  let status: AuthStatus = "unauthenticated";
  if (isInitializing) status = "initializing";
  else if (loginStatus === "logging-in") status = "logging-in";
  else if (loginStatus === "loginError") status = "error";
  else if (isAuthenticated) status = "authenticated";

  return {
    status,
    isAuthenticated,
    isInitializing,
    userId,
    login,
    logout: clear,
  };
}
