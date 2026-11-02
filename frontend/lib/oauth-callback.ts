import client from "./auth-flow-client";
import {
  persistAuthSession,
  SignInStorageError,
  type SignInProblem,
} from "./sign-in";
import type { User } from "./auth";
import { detectTimezone } from "./timezone";

export type CallbackInput = {
  token: string;
  newAccount: boolean;
  problem?: SignInProblem;
};

export function readCallbackInput(params: {
  get(key: string): string | null;
}): CallbackInput {
  const token = params.get("token") || "";
  if (params.get("error"))
    return {
      token: "",
      newAccount: false,
      problem: {
        title: "Provider sign-in wasn’t completed",
        message:
          "The provider did not complete sign-in. Return to the login page to try again or use email and password.",
      },
    };
  if (!token)
    return {
      token: "",
      newAccount: false,
      problem: {
        title: "This sign-in could not be completed",
        message:
          "No sign-in token was received. Start again from the login page.",
      },
    };
  return { token, newAccount: params.get("new") === "1" };
}

export async function completeOAuth(
  input: CallbackInput,
  signal: AbortSignal,
): Promise<User> {
  signal.throwIfAborted();
  if (!input.token || input.problem)
    throw new Error("Provider sign-in incomplete");
  const config = {
    headers: { Authorization: `Bearer ${input.token}` },
    signal,
    timeout: 15000,
  };
  // Explicit provider token: never use a cached session, and verify before persisting auth.
  const response = await client.get<User>("/users/me", config);
  let user = response.data;
  if (
    !user ||
    typeof user.id !== "string" ||
    (user.role !== "developer" && user.role !== "admin")
  )
    throw new Error("Profile unavailable");
  signal.throwIfAborted();
  if (input.newAccount) {
    const timezone = detectTimezone();
    if (timezone) {
      try {
        await client.patch(
          "/users/me",
          { timezone },
          { ...config, timeout: 8000 },
        );
        user = { ...user, timezone };
      } catch {
        // Timezone is optional; an authenticated account remains usable without it.
      }
    }
  }
  signal.throwIfAborted();
  persistAuthSession({ accessToken: input.token, user });
  return user;
}

export function callbackProblem(error: unknown): SignInProblem {
  if (error instanceof SignInStorageError)
    return {
      title: "Your browser couldn’t save the session",
      message: "Allow site storage or use another browser, then sign in again.",
    };
  const response = (error as { response?: { status?: number } } | null)
    ?.response;
  if (response?.status === 401 || response?.status === 403)
    return {
      title: "Your sign-in session is no longer valid",
      message: "Return to the login page and start provider sign-in again.",
    };
  return {
    title: "We couldn’t finish signing you in",
    message:
      "The connection or sign-in service was unavailable. Return to the login page and try again. No new session has been confirmed.",
  };
}
