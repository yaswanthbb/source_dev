import client from "./auth-flow-client";
import { validateLogin, type SignInProblem } from "./sign-in";

export type RecoveryStep = "email" | "code" | "password" | "success";
export type RecoveryOperation = "send" | "resend" | "verify" | "reset";
export type RecoveryValues = {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
};
export type RecoveryErrors = Partial<Record<keyof RecoveryValues, string>>;
export type RecoveryProblem = SignInProblem & {
  startOver?: boolean;
  requestCode?: boolean;
};

export const RECOVERY_CONFIRMATION =
  "If an account with this email exists, we’ve sent a reset code. Check your inbox and spam folder.";
export const RESEND_WAIT_MS = 60000;

export function validateRecovery(
  step: RecoveryStep,
  values: RecoveryValues,
): RecoveryErrors {
  if (step === "email") {
    const email = validateLogin({ email: values.email, password: "" }).email;
    return email ? { email } : {};
  }
  if (step === "code")
    return /^\d{6}$/.test(values.code)
      ? {}
      : { code: "Enter the six-digit code from your email." };
  if (step === "password") {
    const errors: RecoveryErrors = {};
    if (!values.newPassword) errors.newPassword = "Enter a new password.";
    else if (values.newPassword.length < 8)
      errors.newPassword = "Use at least 8 characters.";
    if (!values.confirmPassword)
      errors.confirmPassword = "Confirm your new password.";
    else if (values.confirmPassword !== values.newPassword)
      errors.confirmPassword = "Your passwords don’t match.";
    return errors;
  }
  return {};
}

export function normalizeRecoveryCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function resendSeconds(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

async function post<T>(
  path: string,
  data: unknown,
  signal: AbortSignal,
): Promise<T> {
  signal.throwIfAborted();
  const response = await client.post<T>(path, data, { signal, timeout: 20000 });
  signal.throwIfAborted();
  return response.data;
}

export async function requestRecoveryCode(
  email: string,
  signal: AbortSignal,
): Promise<string> {
  await post("/auth/forgot-password", { email: email.trim() }, signal);
  // Deliberately never infer account existence or guaranteed email delivery.
  return RECOVERY_CONFIRMATION;
}

export async function verifyRecoveryCode(
  email: string,
  code: string,
  signal: AbortSignal,
): Promise<string> {
  const data = await post<{ resetToken: string }>(
    "/auth/verify-otp",
    { email: email.trim(), otp: code },
    signal,
  );
  if (typeof data?.resetToken !== "string" || !data.resetToken)
    throw new Error("Verification response unavailable");
  return data.resetToken;
}

export async function updateRecoveredPassword(
  resetToken: string,
  newPassword: string,
  signal: AbortSignal,
): Promise<void> {
  if (!resetToken) throw new Error("Reset session unavailable");
  await post("/auth/reset-password", { resetToken, newPassword }, signal);
}

export function recoveryProblem(
  error: unknown,
  operation: RecoveryOperation,
): RecoveryProblem {
  const response = (
    error as {
      response?: { status?: number; data?: { message?: unknown } };
    } | null
  )?.response;
  if (!response)
    return {
      title:
        operation === "reset"
          ? "We couldn’t confirm the password update"
          : "We couldn’t complete the request",
      message:
        operation === "reset"
          ? "Check your connection. The update may have completed—try signing in with your new password before trying again."
          : operation === "verify"
            ? "Check your connection and try again. If the code was already used, request a new one."
            : "Check your connection and try again. If a code arrives, use the latest one.",
      requestCode: operation === "verify",
    };
  if (response.status === 429)
    return {
      title: "Please wait before trying again",
      message: "Too many requests were made. Wait a little, then try again.",
    };
  if (response.status && response.status >= 500)
    return {
      title: "Recovery is temporarily unavailable",
      message:
        operation === "reset"
          ? "Try signing in with your new password first. If it wasn’t updated, try again shortly."
          : "The server couldn’t complete your request. Please try again shortly.",
    };
  if (
    operation === "reset" &&
    (response.status === 400 || response.status === 401)
  )
    return {
      title: "Your reset session is no longer valid",
      message:
        "Request a new email code and start again. Your password has not been confirmed as updated.",
      startOver: true,
    };
  if (
    operation === "verify" &&
    (response.status === 400 || response.status === 401)
  )
    return {
      title: "We couldn’t verify that code",
      message:
        "The code is incorrect, expired or has already been used. Check the latest email, or request a new code.",
      requestCode: true,
    };
  return {
    title: "We couldn’t complete recovery",
    message: "Please check your details and try again.",
  };
}
