import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useEffect, useState } from "react";

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
  getUserGender: () => string | null;
  getUserEmail: () => string | null;
  isLoggedIn: () => boolean;
}

const EMAIL_KEY = "vit_user_email";
const GENDER_KEY = "vit_user_gender";
const SESSION_KEY = "vit_session_token";

export function storeEmailSession(email: string, gender: string): void {
  localStorage.setItem(EMAIL_KEY, email);
  localStorage.setItem(GENDER_KEY, gender);
  localStorage.setItem(SESSION_KEY, btoa(`${email}:session`));
}

export function clearEmailSession(): void {
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(GENDER_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function useAuth(): AuthState {
  const { identity, login, clear, loginStatus, isInitializing } =
    useInternetIdentity();

  const [emailLoggedIn, setEmailLoggedIn] = useState<boolean>(
    () => !!localStorage.getItem(SESSION_KEY),
  );

  useEffect(() => {
    const onStorage = () => {
      setEmailLoggedIn(!!localStorage.getItem(SESSION_KEY));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const iiAuthenticated = !!identity;
  const isAuthenticated = iiAuthenticated || emailLoggedIn;

  const userId = identity
    ? identity.getPrincipal().toText()
    : localStorage.getItem(EMAIL_KEY);

  let status: AuthStatus = "unauthenticated";
  if (isInitializing) status = "initializing";
  else if (loginStatus === "logging-in") status = "logging-in";
  else if (loginStatus === "loginError") status = "error";
  else if (isAuthenticated) status = "authenticated";

  const getUserGender = (): string | null => localStorage.getItem(GENDER_KEY);

  const getUserEmail = (): string | null => localStorage.getItem(EMAIL_KEY);

  const isLoggedIn = (): boolean =>
    !!localStorage.getItem(SESSION_KEY) || !!identity;

  const logout = () => {
    clearEmailSession();
    setEmailLoggedIn(false);
    clear();
  };

  return {
    status,
    isAuthenticated,
    isInitializing,
    userId,
    login,
    logout,
    getUserGender,
    getUserEmail,
    isLoggedIn,
  };
}
