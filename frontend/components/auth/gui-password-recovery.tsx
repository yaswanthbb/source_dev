"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { GuiAuthShell } from "./gui-auth-shell";
import {
  normalizeRecoveryCode,
  requestRecoveryCode,
  verifyRecoveryCode,
  updateRecoveredPassword,
  validateRecovery,
  recoveryProblem,
  resendSeconds,
  RESEND_WAIT_MS,
  type RecoveryStep,
  type RecoveryOperation,
  type RecoveryValues,
  type RecoveryErrors,
  type RecoveryProblem,
} from "@/lib/password-recovery";
import styles from "./gui-auth.module.css";

type Notice = RecoveryProblem & {
  kind: "error" | "info";
  validation?: boolean;
};
type Field = {
  key: keyof RecoveryValues;
  label: string;
  autoComplete: string;
  placeholder: string;
  password?: boolean;
};
const stageFields: Record<RecoveryStep, Field[]> = {
  email: [
    {
      key: "email",
      label: "Email address",
      autoComplete: "email",
      placeholder: "you@example.com",
    },
  ],
  code: [
    {
      key: "code",
      label: "Verification code",
      autoComplete: "one-time-code",
      placeholder: "6-digit code",
    },
  ],
  password: [
    {
      key: "newPassword",
      label: "New password",
      autoComplete: "new-password",
      placeholder: "Choose a new password",
      password: true,
    },
    {
      key: "confirmPassword",
      label: "Confirm new password",
      autoComplete: "new-password",
      placeholder: "Repeat your new password",
      password: true,
    },
  ],
  success: [],
};
const titles: Record<RecoveryStep, string> = {
  email: "Let’s get you back in.",
  code: "Check your email.",
  password: "Choose a new password.",
  success: "Password updated.",
};
const submitLabels: Record<RecoveryStep, string> = {
  email: "Send reset code",
  code: "Verify code",
  password: "Update password",
  success: "Sign in",
};
const loadingTitles: Record<RecoveryOperation, string> = {
  send: "Requesting a reset code",
  resend: "Requesting another code",
  verify: "Checking your code",
  reset: "Updating your password",
};

export function GuiPasswordRecovery({
  onSwitchToCli,
}: {
  onSwitchToCli: () => void;
}) {
  const [step, setStep] = useState<RecoveryStep>("email");
  const [values, setValues] = useState<RecoveryValues>({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<RecoveryErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState<RecoveryOperation | null>(null);
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);
  const [focusError, setFocusError] = useState(0);
  const [focusStep, setFocusStep] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const request = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const refs = {
    email: emailRef,
    code: codeRef,
    newPassword: passwordRef,
    confirmPassword: confirmRef,
  };
  const fields = stageFields[step];
  const seconds = resendSeconds(resendAt, now);

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (focusError) noticeRef.current?.focus();
  }, [focusError]);
  useEffect(() => {
    if (focusStep) titleRef.current?.focus();
  }, [focusStep]);
  useEffect(() => {
    if (step !== "code" || !resendAt) return;
    const timer = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= resendAt) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendAt, step]);

  const updateField = (key: keyof RecoveryValues, raw: string) => {
    const value = key === "code" ? normalizeRecoveryCode(raw) : raw;
    const next = { ...values, [key]: value };
    setValues(next);
    const validation = validateRecovery(step, next);
    setErrors((current) => ({
      ...current,
      ...(current[key] ? { [key]: validation[key] } : {}),
      ...(key === "newPassword" && current.confirmPassword
        ? { confirmPassword: validation.confirmPassword }
        : {}),
    }));
    setNotice(null);
  };

  const startAgain = () => {
    if (locked.current) return;
    setStep("email");
    setResetToken("");
    setValues((current) => ({
      email: current.email,
      code: "",
      newPassword: "",
      confirmPassword: "",
    }));
    setShowPassword(false);
    setErrors({});
    setNotice(null);
    setFocusStep((value) => value + 1);
  };

  const perform = async (operation: RecoveryOperation) => {
    if (locked.current || (operation === "resend" && seconds > 0)) return;
    if (operation !== "resend") {
      const validation = validateRecovery(step, values);
      setErrors(validation);
      if (Object.keys(validation).length) {
        setNotice({
          kind: "error",
          title: "Check the fields below",
          message: "Please fix these details and try again.",
          validation: true,
        });
        setFocusError((value) => value + 1);
        return;
      }
    }
    if (operation === "reset" && !resetToken) {
      setNotice({
        kind: "error",
        title: "Your reset session is no longer available",
        message: "Request a new code and start again.",
        startOver: true,
      });
      setFocusError((value) => value + 1);
      return;
    }
    locked.current = true;
    setPending(operation);
    setNotice(null);
    const controller = new AbortController();
    request.current = controller;
    try {
      if (operation === "send" || operation === "resend") {
        const message = await requestRecoveryCode(
          values.email,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setValues((current) => ({
          ...current,
          email: current.email.trim(),
          code: "",
        }));
        const time = Date.now();
        setNow(time);
        setResendAt(time + RESEND_WAIT_MS);
        setStep("code");
        setNotice({ kind: "info", title: "Check for a reset code", message });
      } else if (operation === "verify") {
        const token = await verifyRecoveryCode(
          values.email,
          values.code,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setResetToken(token);
        setValues((current) => ({ ...current, code: "" }));
        setStep("password");
      } else {
        await updateRecoveredPassword(
          resetToken,
          values.newPassword,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setResetToken("");
        setValues((current) => ({
          email: current.email,
          code: "",
          newPassword: "",
          confirmPassword: "",
        }));
        setShowPassword(false);
        setStep("success");
      }
      setErrors({});
      setFocusStep((value) => value + 1);
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      setNotice({ kind: "error", ...recoveryProblem(error, operation) });
      setFocusError((value) => value + 1);
    } finally {
      if (!controller.signal.aborted) {
        locked.current = false;
        setPending(null);
      }
    }
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === "success") return;
    void perform(
      step === "email" ? "send" : step === "code" ? "verify" : "reset",
    );
  };

  return (
    <GuiAuthShell
      kind="recovery"
      onSwitchToCli={onSwitchToCli}
      busy={!!pending}
    >
      <span className={styles.eyebrow}>RECOVER YOUR ACCOUNT</span>
      <h1 id="recovery-title" ref={titleRef} tabIndex={-1}>
        {titles[step]}
      </h1>
      <p className={styles.intro}>
        {step === "email"
          ? "Enter your account email to request a password reset code."
          : step === "code"
            ? `Enter the latest six-digit code for ${values.email}. Codes expire after 10 minutes.`
            : step === "password"
              ? "Your email code was verified. Choose a password with at least 8 characters."
              : "Your password has been changed. Sign in to return to your workspace."}
      </p>
      {step === "success" ? (
        <>
          <GuiFeedback kind="success" title="Your new password is ready">
            Use your new password the next time you sign in.
          </GuiFeedback>
          <div className={styles.statusActions}>
            <Link href="/login" className={styles.submit}>
              Back to sign in <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </>
      ) : (
        <>
          <ol className={styles.recoverySteps} aria-label="Recovery progress">
            {["email", "code", "password"].map((item, index) => (
              <li key={item} aria-current={step === item ? "step" : undefined}>
                <span aria-hidden="true">{index + 1}</span>
                {item === "email"
                  ? "Email"
                  : item === "code"
                    ? "Code"
                    : "Password"}
              </li>
            ))}
          </ol>
          <div className={styles.feedbackSlot}>
            {notice && (
              <GuiFeedback
                ref={noticeRef}
                kind={notice.kind}
                title={notice.title}
                onDismiss={() => {
                  setNotice(null);
                  refs[fields[0].key].current?.focus();
                }}
              >
                {notice.message}
                {notice.validation && (
                  <ul className={styles.errorLinks}>
                    {fields
                      .filter(({ key }) => errors[key])
                      .map(({ key }) => (
                        <li key={key}>
                          <a
                            href={`#recovery-${key}`}
                            onClick={(event) => {
                              event.preventDefault();
                              refs[key].current?.focus();
                            }}
                          >
                            {errors[key]}
                          </a>
                        </li>
                      ))}
                  </ul>
                )}
                {notice.startOver && (
                  <div>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={startAgain}
                    >
                      Request a new code
                    </button>
                  </div>
                )}
                {notice.requestCode && (
                  <div>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      disabled={!!pending || seconds > 0}
                      onClick={() => void perform("resend")}
                    >
                      {seconds > 0
                        ? `Send a new code in ${seconds}s`
                        : "Send a new code"}
                    </button>
                  </div>
                )}
                {notice.kind === "error" && !notice.validation && (
                  <div>
                    <Link href="/login">Return to sign in</Link>
                  </div>
                )}
              </GuiFeedback>
            )}
            {pending && (
              <GuiFeedback kind="loading" title={loadingTitles[pending]}>
                {pending === "reset"
                  ? "Please wait. Leaving this page won’t undo a completed password update."
                  : "This may take a moment. Please wait before trying again."}
              </GuiFeedback>
            )}
          </div>
          <form noValidate onSubmit={submit} aria-busy={!!pending}>
            <fieldset className={styles.fields} disabled={!!pending}>
              <legend className={styles.srOnly}>{titles[step]}</legend>
              {fields.map(
                ({ key, label, autoComplete, placeholder, password }) => (
                  <div className={styles.field} key={key}>
                    <label htmlFor={`recovery-${key}`}>{label}</label>
                    <div
                      className={password ? styles.passwordInput : undefined}
                    >
                      <input
                        ref={refs[key]}
                        id={`recovery-${key}`}
                        name={key}
                        type={
                          password
                            ? showPassword
                              ? "text"
                              : "password"
                            : key === "email"
                              ? "email"
                              : "text"
                        }
                        autoComplete={autoComplete}
                        autoCapitalize="none"
                        spellCheck={false}
                        inputMode={
                          key === "code"
                            ? "numeric"
                            : key === "email"
                              ? "email"
                              : undefined
                        }
                        required
                        className={
                          key === "code" ? styles.codeInput : undefined
                        }
                        placeholder={placeholder}
                        value={values[key]}
                        onChange={(event) =>
                          updateField(key, event.target.value)
                        }
                        onBlur={() =>
                          setErrors((current) => ({
                            ...current,
                            [key]: validateRecovery(step, values)[key],
                          }))
                        }
                        aria-invalid={!!errors[key]}
                        aria-describedby={
                          [
                            key === "newPassword"
                              ? "recovery-password-hint"
                              : "",
                            errors[key] ? `recovery-${key}-error` : "",
                          ]
                            .filter(Boolean)
                            .join(" ") || undefined
                        }
                      />
                      {key === "newPassword" && (
                        <button
                          type="button"
                          aria-label={
                            showPassword ? "Hide passwords" : "Show passwords"
                          }
                          aria-pressed={showPassword}
                          aria-controls="recovery-newPassword recovery-confirmPassword"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff size={18} aria-hidden="true" />
                          ) : (
                            <Eye size={18} aria-hidden="true" />
                          )}
                        </button>
                      )}
                    </div>
                    {key === "newPassword" && (
                      <p
                        id="recovery-password-hint"
                        className={styles.fieldHint}
                      >
                        At least 8 characters. Password managers and paste are
                        supported.
                      </p>
                    )}
                    {errors[key] && (
                      <p
                        className={styles.fieldError}
                        id={`recovery-${key}-error`}
                        role="alert"
                      >
                        {errors[key]}
                      </p>
                    )}
                  </div>
                ),
              )}
              <button type="submit" className={styles.submit}>
                {pending ? (
                  <>
                    {loadingTitles[pending]}{" "}
                    <LoaderCircle
                      size={17}
                      className={styles.spinner}
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  <>
                    {submitLabels[step]}{" "}
                    <ArrowRight size={17} aria-hidden="true" />
                  </>
                )}
              </button>
            </fieldset>
          </form>
          {step !== "email" && (
            <div className={styles.recoveryActions}>
              <button
                type="button"
                className={styles.cancelButton}
                disabled={!!pending}
                onClick={startAgain}
              >
                {step === "code" ? "Use a different email" : "Start again"}
              </button>
              {step === "code" && (
                <button
                  type="button"
                  className={styles.cancelButton}
                  disabled={!!pending || seconds > 0}
                  onClick={() => void perform("resend")}
                >
                  {seconds > 0 ? `Resend code in ${seconds}s` : "Resend code"}
                </button>
              )}
            </div>
          )}
          <p className={styles.registerPrompt}>
            <Link href="/login">Back to sign in</Link>
          </p>
        </>
      )}
    </GuiAuthShell>
  );
}
