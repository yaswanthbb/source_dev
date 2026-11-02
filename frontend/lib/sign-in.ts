import apiClient from "./api-client";
import { clearAuth, setToken, setUser, type User } from "./auth";

export type LoginCredentials = { email: string; password: string };
export type LoginErrors = Partial<Record<keyof LoginCredentials, string>>;
export type SignInProblem = { title: string; message: string };
export type OAuthProvider = "google" | "github";

export class SignInStorageError extends Error {}

export function validateLogin({
  email,
  password,
}: LoginCredentials): LoginErrors {
  const errors: LoginErrors = {};
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  else if (password.length < 8)
    errors.password = "Your password must be at least 8 characters.";
  return errors;
}

export function dashboardFor(role: User["role"]): string {
  return role === "admin" ? "/admin/dashboard" : "/developer/dashboard";
}

/** Same session contract as the terminal login, without its presentation timers. */
export async function signIn(
  credentials: LoginCredentials,
  signal: AbortSignal,
): Promise<User> {
  const { data } = await apiClient.post<{ accessToken: string; user: User }>(
    "/auth/login",
    { email: credentials.email.trim(), password: credentials.password },
    { signal, timeout: 20000 },
  );
  // Switching appearances/unmounting must not finish an abandoned request.
  signal.throwIfAborted();
  persistAuthSession(data);
  return data.user;
}

/** Shared by GUI sign-in and sign-up; preserves existing auth events and session marker. */
export function persistAuthSession(data: {
  accessToken: string;
  user: User;
}): void {
  try {
    setToken(data.accessToken);
    setUser(data.user);
  } catch {
    try {
      clearAuth();
    } catch {
      /* Storage may also refuse cleanup. */
    }
    throw new SignInStorageError("Session storage unavailable");
  }
  try {
    sessionStorage.setItem("sd_just_logged_in", String(Date.now()));
  } catch {
    /* Optional storage must not block a successful sign-in. */
  }
}

export function signInProblem(error: unknown): SignInProblem {
  if (error instanceof SignInStorageError)
    return {
      title: "Your browser couldn’t save the session",
      message: "Allow site storage or try another browser, then sign in again.",
    };
  const response = (
    error as {
      response?: { status?: number; data?: { message?: unknown } };
    } | null
  )?.response;
  const status = response?.status;
  if (!response)
    return {
      title: "We couldn’t reach the server",
      message:
        "Check your connection and try again. Your details are still here.",
    };
  if (status === 429)
    return {
      title: "Too many sign-in attempts",
      message: "Please wait a little before trying again.",
    };
  if (status && status >= 500)
    return {
      title: "Sign-in is temporarily unavailable",
      message:
        "The server couldn’t complete your request. Please try again shortly.",
    };
  const raw = response.data?.message;
  const message = Array.isArray(raw)
    ? raw
        .filter((value): value is string => typeof value === "string")
        .join(" ")
    : typeof raw === "string"
      ? raw
      : "";
  return {
    title: "We couldn’t sign you in",
    message:
      !message || message === "Invalid credentials"
        ? "Your email or password doesn’t match. Try again, or reset your password."
        : message,
  };
}

export function oauthUrl(provider: OAuthProvider): string {
  const base = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}/auth/${provider}`;
}
