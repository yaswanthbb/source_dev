import apiClient from "./api-client";
import type { User } from "./auth";
import { detectTimezone } from "./timezone";
import {
  persistAuthSession,
  SignInStorageError,
  validateLogin,
  type LoginCredentials,
  type SignInProblem,
} from "./sign-in";

export type Registration = LoginCredentials & { name: string };
export type RegistrationErrors = Partial<Record<keyof Registration, string>>;
export type RegistrationProblem = SignInProblem & { signInInstead?: boolean };

export function validateRegistration(values: Registration): RegistrationErrors {
  const errors: RegistrationErrors = validateLogin(values);
  const name = values.name.trim();
  // Match the existing registration form's name rules, including international names.
  if (!name) errors.name = "Enter your full name.";
  else if (name.length < 2)
    errors.name = "Your name must be at least 2 characters.";
  else if (!/^[\p{L}\s.'-]+$/u.test(name))
    errors.name = "Use letters, spaces, apostrophes or hyphens for your name.";
  return errors;
}

export async function signUp(
  values: Registration,
  signal: AbortSignal,
): Promise<User> {
  const { data } = await apiClient.post<{ accessToken: string; user: User }>(
    "/auth/register",
    {
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      timezone: detectTimezone(),
    },
    { signal, timeout: 20000 },
  );
  // Aborting stops handling the response, not the server-side account creation.
  signal.throwIfAborted();
  persistAuthSession(data);
  return data.user;
}

export function registrationProblem(error: unknown): RegistrationProblem {
  if (error instanceof SignInStorageError)
    return {
      title: "Your account was created, but the session wasn’t saved",
      message:
        "Allow site storage or use another browser, then sign in with the details you just chose.",
      signInInstead: true,
    };
  const response = (
    error as {
      response?: { status?: number; data?: { message?: unknown } };
    } | null
  )?.response;
  if (!response)
    return {
      title: "We couldn’t confirm account creation",
      message:
        "Check your connection. Your request may have reached the server—try signing in with these details before creating another account.",
      signInInstead: true,
    };
  if (response.status === 409)
    return {
      title: "This email is already registered",
      message:
        "Sign in to your existing account, use Google or GitHub if that’s how you joined, or reset your password.",
      signInInstead: true,
    };
  if (response.status === 429)
    return {
      title: "Too many requests",
      message:
        "Please wait a little before trying again. Your details are still here.",
    };
  if (response.status && response.status >= 500)
    return {
      title: "Account creation is temporarily unavailable",
      message:
        "Please try again shortly. If you’re unsure whether your account was created, try signing in first.",
      signInInstead: true,
    };
  const raw = response.data?.message;
  const message = Array.isArray(raw)
    ? raw.filter((item): item is string => typeof item === "string").join(" ")
    : typeof raw === "string"
      ? raw
      : "";
  return {
    title: "We couldn’t create your account",
    message: message || "Check your details and try again.",
  };
}
