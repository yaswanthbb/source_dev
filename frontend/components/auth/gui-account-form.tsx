"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { SourceMark } from "@/components/brand/source-mark";
import {
  dashboardFor,
  oauthUrl,
  signIn,
  signInProblem,
  validateLogin,
  type OAuthProvider,
} from "@/lib/sign-in";
import {
  signUp,
  validateRegistration,
  registrationProblem,
  type Registration,
  type RegistrationErrors,
  type RegistrationProblem,
} from "@/lib/sign-up";
import { GuiAuthShell } from "./gui-auth-shell";
import styles from "./gui-auth.module.css";

type Phase =
  "idle" | "submitting" | "success" | "oauth-google" | "oauth-github";
type Notice = RegistrationProblem & {
  kind: "error" | "info";
  validation?: boolean;
};

export function GuiAccountForm({
  kind,
  onSwitchToCli,
}: {
  kind: "login" | "register";
  onSwitchToCli: () => void;
}) {
  const isRegister = kind === "register";
  const prefix = isRegister ? "register" : "login";
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [destination, setDestination] = useState("/developer/dashboard");
  const [focusAttempt, setFocusAttempt] = useState(0);
  const noticeRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const oauth = useRef<OAuthProvider | null>(null);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = phase !== "idle";
  const validate = (values: Registration): RegistrationErrors =>
    isRegister ? validateRegistration(values) : validateLogin(values);
  const fieldRefs = { name: nameRef, email: emailRef, password: passwordRef };
  const fields: {
    key: keyof Registration;
    label: string;
    placeholder: string;
    autoComplete: string;
  }[] = [
    ...(isRegister
      ? [
          {
            key: "name" as const,
            label: "Full name",
            placeholder: "Your full name",
            autoComplete: "name",
          },
        ]
      : []),
    {
      key: "email",
      label: "Email address",
      placeholder: "you@example.com",
      autoComplete: isRegister ? "email" : "username",
    },
    {
      key: "password",
      label: "Password",
      placeholder: isRegister ? "Create a password" : "Enter your password",
      autoComplete: isRegister ? "new-password" : "current-password",
    },
  ];

  useEffect(() => {
    if (focusAttempt) noticeRef.current?.focus();
  }, [focusAttempt]);

  useEffect(() => {
    const recover = () => {
      let provider = oauth.current;
      try {
        const stored = sessionStorage.getItem("sd_oauth_in_flight");
        sessionStorage.removeItem("sd_oauth_in_flight");
        if (stored === "google" || stored === "github") provider = stored;
      } catch {
        /* Back navigation also works without session storage. */
      }
      if (!provider) return;
      locked.current = false;
      oauth.current = null;
      setPhase("idle");
      setPassword("");
      setNotice({
        kind: "info",
        title: `${provider === "google" ? "Google" : "GitHub"} sign-in wasn’t completed`,
        message: isRegister
          ? "Try the provider again, or create your account with email below. If you already joined, use the Sign in link."
          : "You can try again or sign in with your email and password below.",
      });
    };
    recover();
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) recover();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      request.current?.abort();
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
    };
  }, [isRegister]);

  useEffect(() => {
    if (phase !== "success") return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 700;
    navigationTimer.current = setTimeout(
      () => router.replace(destination),
      delay,
    );
    return () => {
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
    };
  }, [phase, destination, router]);

  const updateField = (field: keyof Registration, value: string) => {
    if (field === "name") setName(value);
    else if (field === "email") setEmail(value);
    else setPassword(value);
    if (errors[field]) {
      const next = validate({
        name: field === "name" ? value : name,
        email: field === "email" ? value : email,
        password: field === "password" ? value : password,
      });
      setErrors((current) => ({ ...current, [field]: next[field] }));
    }
    setNotice(null);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked.current) return;
    const nextErrors = validate({ name, email, password });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setNotice({
        kind: "error",
        title: isRegister
          ? "Check your account details"
          : "Check your sign-in details",
        message: "Please fix the fields below and try again.",
        validation: true,
      });
      setFocusAttempt((value) => value + 1);
      return;
    }
    locked.current = true;
    setNotice(null);
    setPhase("submitting");
    const controller = new AbortController();
    request.current = controller;
    try {
      const user = isRegister
        ? await signUp({ name, email, password }, controller.signal)
        : await signIn({ email, password }, controller.signal);
      if (controller.signal.aborted) return;
      setPassword("");
      setDestination(dashboardFor(user.role));
      setPhase("success");
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      locked.current = false;
      setPhase("idle");
      setNotice({
        kind: "error",
        ...(isRegister ? registrationProblem(error) : signInProblem(error)),
      });
      setFocusAttempt((value) => value + 1);
    }
  };

  const startOAuth = (provider: OAuthProvider) => {
    if (locked.current) return;
    locked.current = true;
    oauth.current = provider;
    setNotice(null);
    setPhase(`oauth-${provider}`);
    try {
      try {
        sessionStorage.setItem("sd_oauth_in_flight", provider);
      } catch {
        /* Optional. */
      }
      // Full navigation is intentional: this is the backend's OAuth handshake, not a Next route.
      window.location.assign(new URL(oauthUrl(provider)).href);
    } catch {
      locked.current = false;
      oauth.current = null;
      try {
        sessionStorage.removeItem("sd_oauth_in_flight");
      } catch {
        /* Optional. */
      }
      setPhase("idle");
      setNotice({
        kind: "error",
        title: "We couldn’t open provider sign-in",
        message: "Please try again, or use email and password.",
      });
      setFocusAttempt((value) => value + 1);
    }
  };

  return (
    <GuiAuthShell kind={kind} onSwitchToCli={onSwitchToCli} busy={busy}>
      <span className={styles.eyebrow}>
        {isRegister ? "JOIN SOURCE:DEV" : "SIGN IN TO SOURCE:DEV"}
      </span>
      <h1 id={`${prefix}-title`}>
        {isRegister ? "Make room for ideas." : "Welcome back."}
      </h1>
      <p className={styles.intro}>
        {isRegister
          ? "Create your developer account. Learn a concept, practice it, or build a course of your own."
          : "Your roadmaps, reviews and ideas are all in one place."}
      </p>
      {phase === "success" ? (
        <div className={styles.successPanel}>
          <SourceMark size={64} />
          <GuiFeedback
            kind="success"
            title={isRegister ? "Your account is ready" : "You’re signed in"}
          >
            Opening your{" "}
            {destination.startsWith("/admin") ? "admin" : "developer"}{" "}
            workspace.
          </GuiFeedback>
          <Link
            href={destination}
            className={styles.submit}
            onClick={() => {
              if (navigationTimer.current)
                clearTimeout(navigationTimer.current);
            }}
          >
            Open workspace <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.providers}>
            <button
              type="button"
              disabled={busy}
              onClick={() => startOAuth("google")}
            >
              {phase === "oauth-google" ? (
                <LoaderCircle
                  size={18}
                  className={styles.spinner}
                  aria-hidden="true"
                />
              ) : (
                <ArrowUpRight size={18} aria-hidden="true" />
              )}
              Google
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => startOAuth("github")}
            >
              {phase === "oauth-github" ? (
                <LoaderCircle
                  size={18}
                  className={styles.spinner}
                  aria-hidden="true"
                />
              ) : (
                <ArrowUpRight size={18} aria-hidden="true" />
              )}
              GitHub
            </button>
          </div>
          <div className={styles.divider}>
            <span /> or use your email <span />
          </div>
          <div className={styles.feedbackSlot}>
            {notice && (
              <GuiFeedback
                ref={noticeRef}
                kind={notice.kind}
                title={notice.title}
                onDismiss={() => {
                  setNotice(null);
                  (isRegister ? nameRef : emailRef).current?.focus();
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
                            href={`#${prefix}-${key}`}
                            onClick={(event) => {
                              event.preventDefault();
                              fieldRefs[key].current?.focus();
                            }}
                          >
                            {errors[key]}
                          </a>
                        </li>
                      ))}
                  </ul>
                )}
                {notice.kind === "error" && !notice.validation && (
                  <div>
                    {notice.signInInstead && (
                      <>
                        <Link href="/login">Sign in instead</Link>
                        {" · "}
                      </>
                    )}
                    {(!isRegister || notice.signInInstead) && (
                      <Link href="/forgot-password">Reset your password</Link>
                    )}
                  </div>
                )}
              </GuiFeedback>
            )}
            {phase === "submitting" && (
              <GuiFeedback
                kind="loading"
                title={isRegister ? "Creating your account" : "Signing you in"}
              >
                {isRegister
                  ? "Please wait. Leaving this page may not stop account creation."
                  : "Checking your credentials. This may take a moment."}
                {!isRegister && (
                  <div>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => {
                        request.current?.abort();
                        locked.current = false;
                        setPhase("idle");
                        setNotice({
                          kind: "info",
                          title: "Sign-in cancelled",
                          message:
                            "Your details are still here. You can edit them or try again.",
                        });
                      }}
                    >
                      Cancel sign-in
                    </button>
                  </div>
                )}
              </GuiFeedback>
            )}
            {phase.startsWith("oauth-") && (
              <GuiFeedback
                kind="loading"
                title={`Opening ${phase === "oauth-google" ? "Google" : "GitHub"} sign-in`}
              >
                Continue with the provider. You’ll return here when it’s
                finished.
              </GuiFeedback>
            )}
          </div>
          <form noValidate onSubmit={submit} aria-busy={phase === "submitting"}>
            <fieldset disabled={busy} className={styles.fields}>
              <legend className={styles.srOnly}>
                {isRegister
                  ? "Create an account with name, email and password"
                  : "Sign in with email and password"}
              </legend>
              {fields.map(({ key, label, placeholder, autoComplete }) => (
                <div key={key} className={styles.field}>
                  <div className={styles.labelRow}>
                    <label htmlFor={`${prefix}-${key}`}>{label}</label>
                    {!isRegister && key === "password" && (
                      <Link href="/forgot-password">Forgot password?</Link>
                    )}
                  </div>
                  <div
                    className={
                      key === "password" ? styles.passwordInput : undefined
                    }
                  >
                    <input
                      ref={fieldRefs[key]}
                      id={`${prefix}-${key}`}
                      name={key}
                      type={
                        key === "password"
                          ? showPassword
                            ? "text"
                            : "password"
                          : key === "email"
                            ? "email"
                            : "text"
                      }
                      autoComplete={autoComplete}
                      inputMode={key === "email" ? "email" : undefined}
                      autoCapitalize={key === "name" ? "words" : "none"}
                      spellCheck={false}
                      required
                      placeholder={placeholder}
                      value={
                        key === "name"
                          ? name
                          : key === "email"
                            ? email
                            : password
                      }
                      onChange={(event) => updateField(key, event.target.value)}
                      onBlur={() =>
                        setErrors((current) => ({
                          ...current,
                          [key]: validate({ name, email, password })[key],
                        }))
                      }
                      aria-invalid={!!errors[key]}
                      aria-describedby={
                        [
                          isRegister && key === "password"
                            ? "register-password-hint"
                            : "",
                          errors[key] ? `${prefix}-${key}-error` : "",
                        ]
                          .filter(Boolean)
                          .join(" ") || undefined
                      }
                    />
                    {key === "password" && (
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        aria-pressed={showPassword}
                        aria-controls={`${prefix}-password`}
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
                  {isRegister && key === "password" && (
                    <p id="register-password-hint" className={styles.fieldHint}>
                      At least 8 characters. You can use a password manager.
                    </p>
                  )}
                  {errors[key] && (
                    <p
                      className={styles.fieldError}
                      id={`${prefix}-${key}-error`}
                      role="alert"
                    >
                      {errors[key]}
                    </p>
                  )}
                </div>
              ))}
              <button type="submit" className={styles.submit}>
                {phase === "submitting" ? (
                  <>
                    {isRegister ? "Creating account" : "Signing in"}{" "}
                    <LoaderCircle
                      size={17}
                      className={styles.spinner}
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  <>
                    {isRegister ? "Create account" : "Sign in"}{" "}
                    <ArrowRight size={17} aria-hidden="true" />
                  </>
                )}
              </button>
            </fieldset>
          </form>
          <p className={styles.registerPrompt}>
            {isRegister ? "Already have an account?" : "New to source:dev?"}{" "}
            <Link href={isRegister ? "/login" : "/register"}>
              {isRegister ? "Sign in" : "Create an account"}{" "}
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </p>
        </>
      )}
    </GuiAuthShell>
  );
}
