"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import apiClient from "@/lib/api-client";
import { useTheme } from "@/providers/theme-provider";
import "@/components/home/retro-terminal.css";

// ---------------------------------------------------------------------------
// Schemas (unchanged — same validation contract as the previous design)
// ---------------------------------------------------------------------------
const emailStepSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

const otpStepSchema = z.object({
  otp: z
    .string()
    .min(1, "Verification code is required")
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Code must contain only 6 digits"),
});

const passwordStepSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetStep = "email" | "otp" | "password";

const FULL_COMMAND = "kip-auth --recover";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  // Flow state
  const [currentStep, setCurrentStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifiedOtp, setVerifiedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [showPlaintext, setShowPlaintext] = useState(false);
  const [rekeyed, setRekeyed] = useState(false);

  // Feedback state
  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [streamMessage, setStreamMessage] = useState<string | null>(null);
  const [genericMessage, setGenericMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Shell boot typing
  const [bootPhase, setBootPhase] = useState<"PROMPT" | "TYPING" | "READY">(
    "PROMPT",
  );
  const [typedCommand, setTypedCommand] = useState("");

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const bootTimerRef = useRef<NodeJS.Timeout[]>([]);

  // ------------------------------------------------------------------
  // Boot sequence: pause, type "kip-auth --recover", reveal stage 01
  // ------------------------------------------------------------------
  const skipBootAnimation = useCallback(() => {
    if (bootPhase !== "READY") {
      bootTimerRef.current.forEach(clearTimeout);
      bootTimerRef.current = [];
      setBootPhase("READY");
      setTypedCommand(FULL_COMMAND);
      setTimeout(() => emailInputRef.current?.focus(), 30);
    }
  }, [bootPhase]);

  useEffect(() => {
    const tStart = setTimeout(() => {
      setBootPhase("TYPING");
      const chars = FULL_COMMAND.split("");
      chars.forEach((_, idx) => {
        const tChar = setTimeout(
          () => {
            setTypedCommand(FULL_COMMAND.slice(0, idx + 1));
            if (idx === chars.length - 1) {
              const tEnd = setTimeout(() => {
                setBootPhase("READY");
                setTimeout(() => emailInputRef.current?.focus(), 40);
              }, 120);
              bootTimerRef.current.push(tEnd);
            }
          },
          (idx + 1) * 26,
        );
        bootTimerRef.current.push(tChar);
      });
    }, 500);

    bootTimerRef.current.push(tStart);

    return () => {
      bootTimerRef.current.forEach(clearTimeout);
      bootTimerRef.current = [];
    };
  }, []);

  // Resend cooldown ticker
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ------------------------------------------------------------------
  // Derived identity strings (deterministic, for authentic UNIX output)
  // ------------------------------------------------------------------
  const getDeterministicUid = useCallback((userEmail: string) => {
    let hash = 0;
    for (let i = 0; i < userEmail.length; i++) {
      hash = (hash << 5) - hash + userEmail.charCodeAt(i);
      hash |= 0;
    }
    return 1000 + (Math.abs(hash) % 8999);
  }, []);

  const getHashKey = useCallback((userEmail: string) => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < userEmail.length; i++) {
      hash ^= userEmail.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return (hash % 0xfffff).toString(16).toUpperCase().padStart(5, "0");
  }, []);

  const formatDisplayName = useCallback((userEmail: string) => {
    const local = userEmail.split("@")[0] || "user";
    return local
      .split(/[._-]/)
      .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
      .join(" ");
  }, []);

  const maskEmail = useCallback((userEmail: string) => {
    const [local, domain] = userEmail.split("@");
    if (!local || !domain) return userEmail;
    return `${local.charAt(0)}***@${domain}`;
  }, []);

  // ------------------------------------------------------------------
  // Abort / reset the recovery session (^C, ESC, × button)
  // ------------------------------------------------------------------
  const handleAbortOrReset = useCallback(() => {
    if (bootPhase !== "READY") {
      skipBootAnimation();
      return;
    }
    setCurrentStep("email");
    setOtpDigits(["", "", "", "", "", ""]);
    setVerifiedOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetToken(null);
    setShowPlaintext(false);
    setEmailError(null);
    setOtpError(null);
    setPasswordError(null);
    setGenericMessage(null);
    setStreamMessage(null);
    setIsSubmitting(false);
    setServerError("[SIGNAL] SIGINT: Input buffers cleared.");
    setTimeout(() => emailInputRef.current?.focus(), 50);
  }, [bootPhase, skipBootAnimation]);

  // ------------------------------------------------------------------
  // Stage 01: dispatch challenge token
  // ------------------------------------------------------------------
  const onEmailSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setEmailError(null);
    setServerError(null);

    const parsed = emailStepSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message ?? "Invalid email address");
      emailInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setStreamMessage("Resolving identity signature & dispatch route...");

    try {
      const response = await apiClient.post<{ message: string }>(
        "/auth/forgot-password",
        { email: parsed.data.email },
      );
      setTargetEmail(parsed.data.email);
      setGenericMessage(
        response.data?.message ||
          "If an account with this email exists, we've sent a reset code.",
      );
      setResendCooldown(60);
      setStreamMessage(null);
      setIsSubmitting(false);
      setCurrentStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 60);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setIsSubmitting(false);
      setStreamMessage(null);
      setServerError(
        axiosErr.response?.data?.message ||
          "Failed to process password reset request. Please try again.",
      );
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending || !targetEmail) return;
    setServerError(null);
    setOtpError(null);
    setIsResending(true);
    try {
      await apiClient.post<{ message: string }>("/auth/forgot-password", {
        email: targetEmail,
      });
      setGenericMessage(
        "[OK] New challenge token dispatched. Previous token invalidated.",
      );
      setResendCooldown(60);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(
        axiosErr.response?.data?.message || "Failed to resend reset code.",
      );
    } finally {
      setIsResending(false);
    }
  };

  // ------------------------------------------------------------------
  // Stage 02: verify challenge token
  // ------------------------------------------------------------------
  const onOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setOtpError(null);
    setServerError(null);

    const otp = otpDigits.join("");
    const parsed = otpStepSchema.safeParse({ otp });
    if (!parsed.success) {
      setOtpError(
        parsed.error.issues[0]?.message ?? "Invalid verification code",
      );
      otpRefs.current[Math.min(otp.length, 5)]?.focus();
      return;
    }

    setIsSubmitting(true);
    setStreamMessage("Verifying ed25519 challenge token...");

    try {
      const response = await apiClient.post<{ resetToken: string }>(
        "/auth/verify-otp",
        { email: targetEmail, otp: parsed.data.otp },
      );
      setResetToken(response.data.resetToken);
      setVerifiedOtp(parsed.data.otp);
      setGenericMessage(null);
      setStreamMessage(null);
      setIsSubmitting(false);
      setCurrentStep("password");
      setTimeout(() => passwordInputRef.current?.focus(), 60);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setIsSubmitting(false);
      setStreamMessage(null);
      setServerError(
        axiosErr.response?.data?.message ||
          "401 Unauthorized :: Invalid or expired verification code. [TOKEN_INVALID]",
      );
      otpRefs.current[0]?.focus();
    }
  };

  // ------------------------------------------------------------------
  // Stage 03: cryptographic rekeying
  // ------------------------------------------------------------------
  const onPasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setPasswordError(null);
    setServerError(null);

    if (!resetToken) {
      setServerError("Reset session expired. Please start over.");
      setCurrentStep("email");
      return;
    }

    const parsed = passwordStepSchema.safeParse({
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message ?? "Invalid password");
      passwordInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setStreamMessage("Writing new master key to identity vault...");

    try {
      const response = await apiClient.post<{ message: string }>(
        "/auth/reset-password",
        { resetToken, newPassword: parsed.data.newPassword },
      );
      setStreamMessage(null);
      setRekeyed(true);
      setGenericMessage(
        response.data?.message ||
          "MASTER PASSWORD REKEYED. Redirecting to interactive login...",
      );
      setTimeout(() => router.push("/login"), 1400);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setIsSubmitting(false);
      setStreamMessage(null);
      setServerError(
        axiosErr.response?.data?.message ||
          "Failed to reset password. Token may have expired.",
      );
    }
  };

  // ------------------------------------------------------------------
  // OTP box handling: auto-advance, backspace retreat, paste
  // ------------------------------------------------------------------
  const handleOtpChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    setOtpDigits((prev) => {
      const next = [...prev];
      // Pasting a full code fills forward from the focused box.
      for (let i = 0; i < digits.length && index + i < 6; i++) {
        next[index + i] = digits[i];
      }
      return next;
    });

    if (otpError) setOtpError(null);
    if (serverError) setServerError(null);

    const nextIndex = Math.min(index + digits.length, 5);
    setTimeout(() => otpRefs.current[nextIndex]?.focus(), 0);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      setOtpDigits((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = "";
        } else if (index > 0) {
          next[index - 1] = "";
          setTimeout(() => otpRefs.current[index - 1]?.focus(), 0);
        }
        return next;
      });
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  };

  // ------------------------------------------------------------------
  // Global shortcuts: ESC / ^C abort, any key skips boot
  // ------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (bootPhase !== "READY") {
        skipBootAnimation();
        return;
      }
      if (
        ev.key === "Escape" ||
        (ev.ctrlKey && (ev.key === "c" || ev.key === "C"))
      ) {
        ev.preventDefault();
        handleAbortOrReset();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bootPhase, handleAbortOrReset, skipBootAnimation]);

  // ------------------------------------------------------------------
  // Password policy + entropy analysis
  // ------------------------------------------------------------------
  const hasLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNum = /[0-9]/.test(newPassword);
  const hasSym = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  const entropyScore =
    (hasLen ? 20 : 0) +
    (newPassword.length >= 14 ? 20 : 0) +
    (hasUpper ? 20 : 0) +
    (hasNum ? 20 : 0) +
    (hasSym ? 20 : 0);

  const entropyLabel =
    entropyScore === 100
      ? "[OPTIMAL // 128-BIT]"
      : entropyScore >= 60
        ? "[ACCEPTABLE // 64-BIT]"
        : "[VULNERABLE // INSUFFICIENT]";

  const policies: Array<{ ok: boolean; label: string; wide?: boolean }> = [
    { ok: hasLen, label: "8+ characters" },
    { ok: hasUpper, label: "1 uppercase letter" },
    { ok: hasNum, label: "1 numeric digit (0-9)" },
    { ok: hasSym, label: "1 symbol (!@#$%^&*)" },
    { ok: passwordsMatch, label: "passwords match", wide: true },
  ];

  // ------------------------------------------------------------------
  // Palette (matches login / register exactly)
  // ------------------------------------------------------------------
  const accent = isDark ? "#56d364" : "#b45309";
  const ink = isDark ? "#ffffff" : "#1b1c19";
  const body = isDark ? "#e2e2e5" : "#1b1c19";
  const dim = isDark ? "#c2c7cf" : "#45474a";
  const faint = isDark ? "#8e9194" : "#75777b";
  const line = isDark ? "#333537" : "#c5c6cb";
  const hairline = isDark ? "#333537" : "#e3e3de";
  const panel = isDark ? "#1e2022" : "#f5f4ef";
  const canvas = isDark ? "#0c0e10" : "#ffffff";

  // The meter always renders in the terminal accent (#56d364 dark / #b45309
  // light). Strength reads from how far the bar fills, never from a hue shift.
  const entropyColor = accent;

  const displayName = formatDisplayName(targetEmail || email || "user");
  const derivedUid = getDeterministicUid(targetEmail || email || "user@kip.dev");
  const hashKey = getHashKey(targetEmail || email || "user@kip.dev");

  const stage1Done = currentStep !== "email";
  const stage2Done = currentStep === "password";

  // Left rule for each stage block: 2px accent while active, hairline once done
  const stageBorder = (active: boolean) => ({
    borderLeftWidth: active ? 2 : 1,
    borderLeftStyle: "solid" as const,
    borderLeftColor: active ? accent : line,
  });

  return (
    <div
      className={`retro-terminal-root ${isDark ? "dark" : ""} min-h-screen flex flex-col justify-between select-none`}
    >
      {/* Background Matrix Dot Grid */}
      <div
        className="min-h-screen flex flex-col justify-between w-full relative"
        style={{
          backgroundColor: isDark ? "#121416" : "#faf9f4",
          backgroundImage: isDark
            ? "radial-gradient(#282a2c 1px, transparent 1px)"
            : "radial-gradient(#d5d4ce 1.2px, transparent 1.2px)",
          backgroundSize: "16px 16px",
          color: body,
        }}
      >
        {/* ====================================================================
            TOP NAVBAR (reused from login)
            ==================================================================== */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 h-14 w-full px-4 md:px-6 flex items-center justify-between border-b backdrop-blur-sm transition-colors duration-200 ${
            isDark
              ? "bg-[#111417]/95 border-[#383e47]"
              : "bg-[#faf9f4]/95 border-black/20"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 group min-w-0">
              <span
                className={`w-2.5 h-2.5 inline-block shrink-0 ${isDark ? "bg-[#e6e8eb]" : "bg-black"}`}
              />
              <span
                className={`font-mono text-sm font-bold tracking-tight uppercase truncate ${
                  isDark ? "text-[#e6e8eb]" : "text-black"
                }`}
              >
                KIP
                <span className="hidden sm:inline">
                  {" // KNOWLEDGE IS POWER"}
                </span>
              </span>
            </Link>

            <span
              className={`hidden md:inline text-xs px-2 py-0.5 border uppercase font-mono shrink-0 whitespace-nowrap ${
                isDark
                  ? "border-[#383e47] bg-[#181b1f] text-[#56d364]"
                  : "border-black/40 bg-[#f5f4ef] text-black"
              }`}
            >
              [SYS: OK]
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle light/dark mode"
              title={`Toggle Mode: currently ${isDark ? "Dark" : "Light"}`}
              className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-mono font-bold tracking-wider whitespace-nowrap cursor-pointer select-none transition-none ${
                isDark
                  ? "text-[#e6e8eb] bg-[#14171b] border border-[#383e47] hover:border-[#e6e8eb] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.6)]"
                  : "text-black bg-white border border-black hover:bg-[#e9e8e3] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              <span
                className={`w-2 h-2 inline-block shrink-0 ${isDark ? "bg-[#56d364]" : "bg-black"}`}
              />
              <span className="hidden sm:inline">
                {isDark ? "[MODE: DK]" : "[MODE: LT]"}
              </span>
              <span className="sm:hidden">{isDark ? "[DK]" : "[LT]"}</span>
            </button>

            <Link
              href="/login"
              className={`inline-flex text-xs px-2 sm:px-3 py-1 border uppercase font-mono whitespace-nowrap transition-colors ${
                isDark
                  ? "border-[#383e47] bg-[#14171b] text-[#e6e8eb] hover:bg-[#1e2227]"
                  : "border-[#c5c6cb] bg-[#f5f4ef] text-black hover:bg-[#e9e8e3]"
              }`}
            >
              <span className="hidden sm:inline">[AUTH: SIGN_IN]</span>
              <span className="sm:hidden">[AUTH]</span>
            </Link>
          </div>
        </header>

        {/* ====================================================================
            MAIN VIEWPORT: CENTERED TTY_RECOVERY WINDOW
            ==================================================================== */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full pt-20 pb-16">
          <div className="w-full max-w-2xl flex flex-col gap-3 font-mono">
            {/* Terminal Window Container */}
            <div
              className={`w-full transition-all ${
                isDark
                  ? "bg-[#1a1c1e] border border-[#333537] shadow-[6px_6px_0px_0px_#000000]"
                  : "bg-[#efeee9] border border-[#c5c6cb] shadow-[6px_6px_0px_0px_#1b1c19]"
              }`}
            >
              {/* Window Title Bar */}
              <div
                className={`px-3 sm:px-4 py-2 flex items-center justify-between border-b select-none ${
                  isDark
                    ? "bg-[#1e2022] border-[#333537] text-[#c2c7cf]"
                    : "bg-[#e9e8e3] border-[#c5c6cb] text-[#1b1c19]"
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span
                    className="inline-block w-2.5 h-2.5 shrink-0"
                    style={{ backgroundColor: accent }}
                  />
                  <span className="text-[13px] font-bold tracking-wide truncate">
                    {"KIP // TTY_RECOVERY_v2.4"}
                  </span>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span
                    className="text-[11px] px-1.5 py-0.5 border font-medium hidden sm:inline-block whitespace-nowrap"
                    style={{
                      backgroundColor: panel,
                      borderColor: line,
                      color: accent,
                    }}
                  >
                    [SEC: 0x4]
                  </span>
                  <span
                    className="text-[11px] px-1.5 py-0.5 border font-medium hidden sm:inline-block whitespace-nowrap"
                    style={{
                      backgroundColor: panel,
                      borderColor: line,
                      color: dim,
                    }}
                  >
                    [TTY: /dev/tty1]
                  </span>
                  <div className="flex space-x-1 ml-1">
                    <button
                      type="button"
                      onClick={() => emailInputRef.current?.focus()}
                      title="Minimize / Focus"
                      className={`w-4 h-4 flex items-center justify-center text-[11px] border cursor-pointer transition-colors ${
                        isDark
                          ? "bg-[#1e2022] border-[#333537] text-[#c4c7c9] hover:bg-[#282a2c]"
                          : "bg-[#f5f4ef] border-[#c5c6cb] text-[#1b1c19] hover:bg-[#e3e3de]"
                      }`}
                    >
                      _
                    </button>
                    <button
                      type="button"
                      title="Window Option"
                      className={`w-4 h-4 flex items-center justify-center text-[11px] border cursor-pointer transition-colors ${
                        isDark
                          ? "bg-[#1e2022] border-[#333537] text-[#c4c7c9] hover:bg-[#282a2c]"
                          : "bg-[#f5f4ef] border-[#c5c6cb] text-[#1b1c19] hover:bg-[#e3e3de]"
                      }`}
                    >
                      □
                    </button>
                    <button
                      type="button"
                      onClick={handleAbortOrReset}
                      title="Reset / Abort"
                      className={`w-4 h-4 flex items-center justify-center text-[11px] border cursor-pointer transition-colors ${
                        isDark
                          ? "bg-[#1e2022] border-[#333537] text-[#56d364] hover:bg-[#93000a] hover:text-[#ffdad6]"
                          : "bg-[#f5f4ef] border-[#c5c6cb] text-[#ba1a1a] hover:bg-red-100"
                      }`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              {/* Inner Window Panel */}
              <div className="p-3.5 sm:p-5 flex flex-col space-y-4">
                <div
                  className="p-3.5 sm:p-4 text-xs sm:text-[13px] space-y-3.5 border"
                  style={{
                    backgroundColor: canvas,
                    borderColor: hairline,
                    color: body,
                  }}
                >
                  {/* ASCII Art Logo */}
                  <pre
                    className="leading-none overflow-hidden select-none font-bold text-xs sm:text-[13px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ color: ink }}
                  >
                    {` _  _______ _____
| |/ /_   _|  __ \\
| ' /  | | | |__) |
|  <   | | |  ___/
| . \\ _| |_| |
|_|\\_\\_____|_|     `}
                  </pre>

                  {/* Daemon Architecture Header */}
                  <div
                    className="border-b pb-2 space-y-1"
                    style={{ borderColor: hairline }}
                  >
                    <p
                      className="font-bold tracking-wide uppercase"
                      style={{ color: ink }}
                    >
                      {"KNOWLEDGE IS POWER // CORE ARCHITECTURE DAEMON"}
                    </p>
                    <p className="text-[11px]" style={{ color: dim }}>
                      Session: tty1 :: Connected: 127.0.0.1
                      (ed25519-sha2-nistp256)
                    </p>
                  </div>

                  {/* Shell Command Line */}
                  <div
                    className="flex items-center text-xs sm:text-[13px] font-mono select-none flex-wrap pt-0.5 cursor-pointer"
                    onClick={skipBootAnimation}
                  >
                    <span className="font-bold" style={{ color: accent }}>
                      sys@daemon
                    </span>
                    <span style={{ color: dim }}>
                      {isDark ? ":/opt/kip$" : ":/opt/kip"}
                    </span>
                    {!isDark && (
                      <span className="font-bold" style={{ color: ink }}>
                        $
                      </span>
                    )}
                    {typedCommand && (
                      <span
                        className="font-bold ml-1.5"
                        style={{ color: ink }}
                      >
                        {typedCommand}
                      </span>
                    )}
                    {bootPhase !== "READY" && (
                      <span
                        aria-hidden="true"
                        className={`retro-terminal-cursor !w-[9px] !h-[18px] ${
                          typedCommand ? "ml-1" : "ml-1.5"
                        }`}
                        style={{ color: accent }}
                      />
                    )}
                  </div>

                  {bootPhase === "READY" && (
                    <div className="space-y-2.5 pt-0.5 animate-in fade-in duration-150">
                      {/* ============================================
                          STAGE 01: IDENTITY DISPATCH
                          ============================================ */}
                      <div
                        className="flex flex-col space-y-1 pl-2 transition-all duration-150"
                        style={stageBorder(currentStep === "email")}
                      >
                        {currentStep === "email" ? (
                          <form onSubmit={onEmailSubmit} noValidate>
                            <div className="flex items-center justify-between flex-wrap gap-2 text-[11px]">
                              <span
                                className="font-bold"
                                style={{ color: accent }}
                              >
                                &gt; [STAGE 01: IDENTITY_DISPATCH]
                              </span>
                              <span
                                className="px-1.5 py-0.5 border font-bold whitespace-nowrap"
                                style={{
                                  backgroundColor: panel,
                                  borderColor: line,
                                  color: ink,
                                }}
                              >
                                [STATE: AWAITING]
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap pt-1.5">
                              <label
                                htmlFor="recovery-email"
                                className="font-medium select-none whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                                style={{ color: dim }}
                              >
                                <span
                                  className="font-bold"
                                  style={{ color: accent }}
                                >
                                  &gt;
                                </span>
                                <span>kip-auth email:</span>
                              </label>

                              <div
                                className="relative flex items-center flex-1 min-w-[170px] cursor-text"
                                onClick={() => emailInputRef.current?.focus()}
                              >
                                <span
                                  className="font-bold tracking-wide text-xs sm:text-[13px] whitespace-pre select-none truncate"
                                  style={{ color: ink }}
                                >
                                  {email}
                                </span>
                                <span
                                  aria-hidden="true"
                                  className="retro-terminal-cursor !w-[9px] !h-[18px]"
                                  style={{ color: accent }}
                                />
                                <input
                                  id="recovery-email"
                                  type="email"
                                  autoComplete="email"
                                  autoFocus
                                  ref={emailInputRef}
                                  value={email}
                                  onChange={(ev) => {
                                    setEmail(ev.target.value);
                                    if (emailError) setEmailError(null);
                                    if (serverError) setServerError(null);
                                  }}
                                  disabled={isSubmitting}
                                  className="absolute inset-0 w-full h-full opacity-0 pointer-events-auto cursor-text caret-transparent p-0 m-0 border-none bg-transparent"
                                />
                              </div>
                            </div>

                            {emailError && (
                              <p className="text-[11px] text-red-500 font-medium pl-1 pt-1.5 animate-in fade-in duration-150">
                                [ERR_INVALID_IDENTITY]: {emailError}
                              </p>
                            )}

                            <p
                              className="text-[11px] pl-1 pt-1.5"
                              style={{ color: faint }}
                            >
                              [ Press{" "}
                              <span style={{ color: accent }}>ENTER</span> to
                              dispatch challenge token |{" "}
                              <span style={{ color: accent }}>ESC</span> to
                              clear ]
                            </p>

                            <button
                              type="submit"
                              className="hidden"
                              aria-hidden="true"
                            />
                          </form>
                        ) : (
                          <>
                            <div
                              className="flex items-center justify-between flex-wrap gap-2"
                              style={{ color: dim }}
                            >
                              <span className="min-w-0 break-all">
                                <span
                                  className="font-bold"
                                  style={{ color: accent }}
                                >
                                  &gt;
                                </span>{" "}
                                kip-auth email:{" "}
                                <span
                                  className="font-bold"
                                  style={{ color: ink }}
                                >
                                  {targetEmail}
                                </span>
                              </span>
                              <span
                                className="text-[11px] font-medium whitespace-nowrap"
                                style={{ color: faint }}
                              >
                                [01_DISPATCH]
                              </span>
                            </div>
                            <div
                              className="text-[11px] pl-1 space-y-1"
                              style={{ color: dim }}
                            >
                              <p className="break-words">
                                <span
                                  className="font-bold"
                                  style={{ color: accent }}
                                >
                                  [OK]
                                </span>{" "}
                                <span
                                  className="font-medium"
                                  style={{ color: ink }}
                                >
                                  Identity verified:
                                </span>{" "}
                                {displayName} &lt;{targetEmail}&gt; (UID:{" "}
                                {derivedUid})
                              </p>
                              <p className="break-words">
                                <span
                                  className="font-bold"
                                  style={{ color: accent }}
                                >
                                  [OK]
                                </span>{" "}
                                Challenge token dispatched to{" "}
                                {maskEmail(targetEmail)} (exp: 600s)
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* ============================================
                          STAGE 02: CHALLENGE TOKEN
                          ============================================ */}
                      {stage1Done && (
                        <div
                          className="flex flex-col space-y-1 pl-2 transition-all duration-150 animate-in fade-in slide-in-from-top-1"
                          style={stageBorder(currentStep === "otp")}
                        >
                          {currentStep === "otp" ? (
                            <form onSubmit={onOtpSubmit} noValidate>
                              <div className="flex items-center justify-between flex-wrap gap-2 text-[11px]">
                                <span
                                  className="font-bold"
                                  style={{ color: accent }}
                                >
                                  &gt; [STAGE 02: TOKEN_AUTHENTICATION]
                                </span>
                                <span
                                  className="px-1.5 py-0.5 border font-bold whitespace-nowrap"
                                  style={{
                                    backgroundColor: panel,
                                    borderColor: line,
                                    color: ink,
                                  }}
                                >
                                  [STATE: CHALLENGE]
                                </span>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap pt-1.5">
                                <span
                                  className="font-medium select-none whitespace-nowrap flex items-center gap-1.5"
                                  style={{ color: dim }}
                                >
                                  <span
                                    className="font-bold"
                                    style={{ color: accent }}
                                  >
                                    &gt;
                                  </span>
                                  <span>kip-auth otp_code:</span>
                                </span>

                                <div className="flex items-center gap-1 sm:gap-1.5">
                                  {otpDigits.map((digit, i) => (
                                    <input
                                      key={i}
                                      ref={(el) => {
                                        otpRefs.current[i] = el;
                                      }}
                                      type="text"
                                      inputMode="numeric"
                                      autoComplete="one-time-code"
                                      maxLength={6}
                                      aria-label={`Digit ${i + 1} of 6`}
                                      value={digit}
                                      onChange={(ev) =>
                                        handleOtpChange(i, ev.target.value)
                                      }
                                      onKeyDown={(ev) =>
                                        handleOtpKeyDown(i, ev)
                                      }
                                      disabled={isSubmitting}
                                      className="w-7 h-9 sm:w-8 sm:h-10 text-center font-mono font-bold text-sm border outline-none focus:outline-none transition-colors"
                                      style={{
                                        backgroundColor: panel,
                                        borderColor: digit ? accent : line,
                                        color: ink,
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>

                              {otpError && (
                                <p className="text-[11px] text-red-500 font-medium pl-1 pt-1.5 animate-in fade-in duration-150">
                                  [ERR_INVALID_TOKEN]: {otpError}
                                </p>
                              )}

                              {genericMessage && (
                                <p
                                  className="text-[11px] pl-1 pt-1.5 break-words"
                                  style={{ color: dim }}
                                >
                                  <span
                                    className="font-bold"
                                    style={{ color: accent }}
                                  >
                                    [SYS]
                                  </span>{" "}
                                  {genericMessage}
                                </p>
                              )}

                              <div className="flex items-center gap-2 flex-wrap pt-1.5">
                                <button
                                  type="button"
                                  onClick={handleResendOtp}
                                  disabled={
                                    resendCooldown > 0 ||
                                    isResending ||
                                    isSubmitting
                                  }
                                  className="text-[10px] uppercase font-mono px-1.5 py-0.5 border cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
                                  style={{
                                    backgroundColor: panel,
                                    borderColor: line,
                                    color: resendCooldown > 0 ? faint : dim,
                                  }}
                                >
                                  {isResending
                                    ? "[DISPATCHING...]"
                                    : resendCooldown > 0
                                      ? `[RESEND: ${resendCooldown}s]`
                                      : "[RESEND_TOKEN]"}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleAbortOrReset}
                                  className="text-[10px] uppercase font-mono px-1.5 py-0.5 border cursor-pointer transition-colors whitespace-nowrap"
                                  style={{
                                    backgroundColor: panel,
                                    borderColor: line,
                                    color: dim,
                                  }}
                                >
                                  [EDIT_EMAIL]
                                </button>
                              </div>

                              <p
                                className="text-[11px] pl-1 pt-1.5"
                                style={{ color: faint }}
                              >
                                [ Press{" "}
                                <span style={{ color: accent }}>ENTER</span> to
                                verify token |{" "}
                                <span style={{ color: accent }}>^C</span> to
                                abort ]
                              </p>

                              <button
                                type="submit"
                                className="hidden"
                                aria-hidden="true"
                              />
                            </form>
                          ) : (
                            <>
                              <div
                                className="flex items-center justify-between flex-wrap gap-2"
                                style={{ color: dim }}
                              >
                                <span>
                                  <span
                                    className="font-bold"
                                    style={{ color: accent }}
                                  >
                                    &gt;
                                  </span>{" "}
                                  kip-auth otp_code:{" "}
                                  <span
                                    className="font-bold tracking-widest"
                                    style={{ color: ink }}
                                  >
                                    {verifiedOtp.split("").join(" ")}
                                  </span>
                                </span>
                                <span
                                  className="text-[11px] font-medium whitespace-nowrap"
                                  style={{ color: faint }}
                                >
                                  [02_AUTH_PIN]
                                </span>
                              </div>
                              <div
                                className="text-[11px] font-medium pl-1 break-words"
                                style={{ color: dim }}
                              >
                                <span
                                  className="font-bold"
                                  style={{ color: accent }}
                                >
                                  [OK]
                                </span>{" "}
                                <span style={{ color: ink }}>
                                  Token verified: ed25519-valid :: Session
                                  state:
                                </span>{" "}
                                <span
                                  className="font-bold"
                                  style={{ color: accent }}
                                >
                                  AUTHORIZED_FOR_REKEY
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* ============================================
                          STAGE 03: CRYPTOGRAPHIC REKEYING
                          ============================================ */}
                      {stage2Done && (
                        <div
                          className="flex flex-col space-y-1.5 pl-2 transition-all duration-150 animate-in fade-in slide-in-from-top-1"
                          style={stageBorder(true)}
                        >
                          <form onSubmit={onPasswordSubmit} noValidate>
                            <div className="flex items-center justify-between flex-wrap gap-2 text-[11px]">
                              <span
                                className="font-bold"
                                style={{ color: accent }}
                              >
                                &gt; [STAGE 03: CRYPTOGRAPHIC_REKEYING]
                              </span>
                              <span
                                className="px-1.5 py-0.5 border font-bold whitespace-nowrap"
                                style={{
                                  backgroundColor: panel,
                                  borderColor: line,
                                  color: ink,
                                }}
                              >
                                [STATE: WRITABLE]
                              </span>
                            </div>

                            {/* New password */}
                            <div className="flex items-center gap-2 flex-wrap pt-2">
                              <label
                                htmlFor="recovery-new-password"
                                className="font-medium select-none whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                                style={{ color: dim }}
                              >
                                <span
                                  className="font-bold"
                                  style={{ color: accent }}
                                >
                                  &gt;
                                </span>
                                <span>kip-auth new_password:</span>
                              </label>

                              <div
                                className="relative flex items-center flex-1 min-w-[120px] cursor-text"
                                onClick={() =>
                                  passwordInputRef.current?.focus()
                                }
                              >
                                <span
                                  className="font-bold text-xs sm:text-[13px] select-none tracking-widest whitespace-pre truncate"
                                  style={{ color: ink }}
                                >
                                  {showPlaintext
                                    ? newPassword
                                    : "•".repeat(newPassword.length)}
                                </span>
                                <span
                                  aria-hidden="true"
                                  className="retro-terminal-cursor !w-[9px] !h-[18px]"
                                  style={{ color: accent }}
                                />
                                <input
                                  id="recovery-new-password"
                                  type={showPlaintext ? "text" : "password"}
                                  autoComplete="new-password"
                                  ref={passwordInputRef}
                                  value={newPassword}
                                  onChange={(ev) => {
                                    setNewPassword(ev.target.value);
                                    if (passwordError) setPasswordError(null);
                                    if (serverError) setServerError(null);
                                  }}
                                  disabled={isSubmitting || rekeyed}
                                  className="absolute inset-0 w-full h-full opacity-0 pointer-events-auto cursor-text caret-transparent p-0 m-0 border-none bg-transparent"
                                />
                              </div>
                            </div>

                            {/* Confirm password */}
                            <div className="flex items-center gap-2 flex-wrap pt-1.5">
                              <label
                                htmlFor="recovery-confirm-password"
                                className="font-medium select-none whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                                style={{ color: dim }}
                              >
                                <span
                                  className="font-bold"
                                  style={{ color: accent }}
                                >
                                  &gt;
                                </span>
                                <span>kip-auth confirm_password:</span>
                              </label>

                              <div
                                className="relative flex items-center flex-1 min-w-[100px] cursor-text"
                                onClick={() => confirmInputRef.current?.focus()}
                              >
                                <span
                                  className="font-bold text-xs sm:text-[13px] select-none tracking-widest whitespace-pre truncate"
                                  style={{ color: ink }}
                                >
                                  {showPlaintext
                                    ? confirmPassword
                                    : "•".repeat(confirmPassword.length)}
                                </span>
                                <input
                                  id="recovery-confirm-password"
                                  type={showPlaintext ? "text" : "password"}
                                  autoComplete="new-password"
                                  ref={confirmInputRef}
                                  value={confirmPassword}
                                  onChange={(ev) => {
                                    setConfirmPassword(ev.target.value);
                                    if (passwordError) setPasswordError(null);
                                    if (serverError) setServerError(null);
                                  }}
                                  disabled={isSubmitting || rekeyed}
                                  className="absolute inset-0 w-full h-full opacity-0 pointer-events-auto cursor-text caret-transparent p-0 m-0 border-none bg-transparent"
                                />
                              </div>

                              {passwordsMatch && (
                                <span
                                  className="font-bold text-[11px] whitespace-nowrap"
                                  style={{ color: accent }}
                                >
                                  [VALIDATED]
                                </span>
                              )}
                            </div>

                            <div className="pt-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPlaintext(!showPlaintext);
                                  setTimeout(
                                    () => passwordInputRef.current?.focus(),
                                    10,
                                  );
                                }}
                                className="text-[10px] uppercase font-mono px-1.5 py-0.5 border cursor-pointer transition-colors whitespace-nowrap"
                                style={{
                                  backgroundColor: panel,
                                  borderColor: line,
                                  color: dim,
                                }}
                              >
                                {showPlaintext
                                  ? "[MASK_PLAINTEXT]"
                                  : "[SHOW_PLAINTEXT]"}
                              </button>
                            </div>

                            {passwordError && (
                              <p className="text-[11px] text-red-500 font-medium pl-1 pt-1.5 animate-in fade-in duration-150">
                                [ERR_POLICY_VIOLATION]: {passwordError}
                              </p>
                            )}

                            {/* Policy assertion checklist */}
                            <div
                              className="p-2 border flex flex-col space-y-1.5 mt-2 select-none"
                              style={{
                                backgroundColor: panel,
                                borderColor: hairline,
                              }}
                            >
                              <div
                                className="text-[10px] font-bold tracking-wider uppercase"
                                style={{ color: dim }}
                              >
                                POLICIES_ASSERTION_CHECKLIST:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                                {policies.map((p) => (
                                  <div
                                    key={p.label}
                                    className={`flex items-center space-x-1.5 ${
                                      p.wide ? "sm:col-span-2" : ""
                                    }`}
                                    style={{ color: p.ok ? ink : faint }}
                                  >
                                    <span
                                      className="font-bold shrink-0"
                                      style={{ color: p.ok ? accent : faint }}
                                    >
                                      {p.ok ? "[✓]" : "[ ]"}
                                    </span>
                                    <span className="truncate">{p.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Entropy analysis */}
                            <div className="flex flex-col space-y-1 mt-2">
                              <div className="flex items-center justify-between gap-2 text-[11px]">
                                <span
                                  className="font-medium truncate min-w-0"
                                  style={{ color: dim }}
                                >
                                  ENTROPY_ANALYSIS:
                                </span>
                                <span
                                  className="font-bold shrink-0 whitespace-nowrap"
                                  style={{ color: entropyColor }}
                                >
                                  {entropyScore}% {entropyLabel}
                                </span>
                              </div>
                              {/* Fluid 20-block bar: the segment gaps are drawn
                                  as a repeating overlay so the meter scales to
                                  its column instead of overflowing on phones. */}
                              <div
                                className="flex items-center gap-1 border px-1.5 py-1 text-[13px] font-bold select-none"
                                style={{
                                  backgroundColor: panel,
                                  borderColor: line,
                                  color: entropyColor,
                                }}
                              >
                                <span className="shrink-0">[</span>
                                <span
                                  className="flex-1 min-w-0 h-3.5"
                                  style={{
                                    backgroundImage: `repeating-linear-gradient(to right, transparent 0 calc(5% - 2px), ${panel} calc(5% - 2px) 5%), linear-gradient(to right, ${entropyColor} 0 ${entropyScore}%, ${hairline} ${entropyScore}% 100%)`,
                                  }}
                                />
                                <span className="shrink-0">]</span>
                              </div>
                            </div>

                            <p
                              className="text-[11px] pl-1 pt-2"
                              style={{ color: faint }}
                            >
                              [ Press{" "}
                              <span style={{ color: accent }}>ENTER</span> to
                              execute rekey |{" "}
                              <span style={{ color: accent }}>^C</span> to abort
                              ]
                            </p>

                            <button
                              type="submit"
                              className="hidden"
                              aria-hidden="true"
                            />
                          </form>
                        </div>
                      )}

                      {/* Stream / success / error feedback */}
                      {streamMessage && (
                        <div
                          className="p-2 border text-[11px] animate-in fade-in duration-150"
                          style={{
                            backgroundColor: panel,
                            borderColor: line,
                            color: accent,
                          }}
                        >
                          <div className="flex items-start gap-1.5">
                            <span className="font-bold flex-shrink-0">
                              [SYS_STREAM]:
                            </span>
                            <span className="animate-pulse">
                              {streamMessage}
                            </span>
                          </div>
                        </div>
                      )}

                      {rekeyed && genericMessage && (
                        <div
                          className="p-2 border text-[11px] animate-in fade-in duration-150"
                          style={{
                            backgroundColor: panel,
                            borderColor: line,
                            color: accent,
                          }}
                        >
                          <div className="flex items-start gap-1.5">
                            <span className="font-bold flex-shrink-0">
                              [SUCCESS]:
                            </span>
                            <span>{genericMessage}</span>
                          </div>
                        </div>
                      )}

                      {serverError && (
                        <div
                          className={`p-2 border text-[11px] animate-in fade-in duration-150 ${
                            isDark
                              ? "bg-[#281313] border-red-800 text-red-300"
                              : "bg-red-50 border-red-300 text-red-700"
                          }`}
                        >
                          <div className="flex items-start gap-1.5">
                            <span className="font-bold text-red-500 flex-shrink-0">
                              [ERR]:
                            </span>
                            <span className="break-words">{serverError}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Window Bottom Status Strip */}
              <div
                className="border-t px-3 sm:px-4 py-1 flex items-center justify-between gap-2 text-[10px] sm:text-[11px]"
                style={{
                  backgroundColor: isDark ? "#1e2022" : "#e9e8e3",
                  borderColor: line,
                  color: dim,
                }}
              >
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                  <span className="hidden sm:inline whitespace-nowrap">
                    MEM: 14.2MB
                  </span>
                  <span className="hidden sm:inline" style={{ color: line }}>
                    |
                  </span>
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <span
                      className="w-1.5 h-1.5 inline-block shrink-0"
                      style={{ backgroundColor: accent }}
                    />
                    <span style={{ color: ink }}>SOCK: LIVE</span>
                  </span>
                </div>
                <div
                  className="truncate min-w-0 text-right"
                  style={{ color: faint }}
                >
                  HASH_KEY: 0x{hashKey}
                </div>
              </div>
            </div>

            {/* Below-window keybindings */}
            {bootPhase === "READY" && (
              <div className="flex flex-col space-y-1.5 px-1 animate-in fade-in duration-150">
                <div
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] font-medium"
                  style={{ color: dim }}
                >
                  <button
                    type="button"
                    onClick={
                      currentStep === "email"
                        ? onEmailSubmit
                        : currentStep === "otp"
                          ? onOtpSubmit
                          : onPasswordSubmit
                    }
                    disabled={isSubmitting || rekeyed}
                    className="hover:underline transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span className="font-bold" style={{ color: accent }}>
                      [ENTER]
                    </span>{" "}
                    <span style={{ color: ink }}>
                      {currentStep === "password" ? "EXECUTE" : "VALIDATE"}
                      <span className="hidden sm:inline">
                        {currentStep === "password"
                          ? "_REKEY"
                          : "_IDENTITY"}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAbortOrReset}
                    className="hover:underline transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span className="font-bold" style={{ color: accent }}>
                      [^C]
                    </span>{" "}
                    <span style={{ color: ink }}>
                      RESET<span className="hidden sm:inline"> / ABORT</span>
                    </span>
                  </button>

                  <Link
                    href="/login"
                    className="hover:underline transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span className="font-bold" style={{ color: accent }}>
                      [TAB]
                    </span>{" "}
                    <span style={{ color: ink }}>SIGN_IN</span>
                  </Link>
                </div>

                <div
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t pt-1.5 text-[10px]"
                  style={{ borderColor: hairline, color: faint }}
                >
                  <Link
                    href="/register"
                    className="hover:underline transition-colors whitespace-nowrap"
                  >
                    <span className="font-bold" style={{ color: accent }}>
                      [?]
                    </span>{" "}
                    <span>
                      HELP<span className="hidden sm:inline">
                        {" / RECOVERY_PROTOCOL"}
                      </span>
                    </span>
                  </Link>
                  <span className="whitespace-nowrap">
                    <span className="hidden sm:inline">SESSION_</span>ENC: UTF-8
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ====================================================================
            BOTTOM NAVBAR / FOOTER (reused from login)
            ==================================================================== */}
        <footer
          className={`w-full border-t transition-colors duration-200 ${
            isDark
              ? "bg-[#14171b] border-[#2a2e34]"
              : "bg-[#f5f4ef] border-black/20"
          }`}
        >
          <div className="w-full px-4 md:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-3 text-[10px] sm:text-xs">
            <div
              className={`font-mono uppercase tracking-wider text-center md:text-left ${
                isDark ? "text-[#8b939e]" : "text-[#45474a]"
              }`}
            >
              KIP © 2026 • ZERO COOKIES
              <span className="hidden sm:inline"> • ZERO TRACKERS</span>
            </div>

            <div
              className={`flex items-center gap-2 font-mono uppercase ${
                isDark ? "text-[#cbd0d6]" : "text-black"
              }`}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full animate-pulse shrink-0 ${
                  isDark ? "bg-[#56d364]" : "bg-[#fe932c]"
                }`}
              />
              <span className="whitespace-nowrap">
                ● DAEMON RUNNING
                <span className="hidden sm:inline">{" // LATENCY < 4ms"}</span>
              </span>
            </div>

            <div
              className={`flex items-center gap-2 font-mono ${
                isDark ? "text-[#8b939e]" : "text-[#45474a]"
              }`}
            >
              <Link
                href="/"
                className={`px-2 py-0.5 border transition-colors ${
                  isDark
                    ? "border-[#383e47] bg-[#181b1f] text-[#e6e8eb] hover:bg-[#282e37]"
                    : "border-[#c5c6cb] bg-white text-black hover:bg-[#e9e8e3]"
                }`}
              >
                [ESC: HOME]
              </Link>
              <Link
                href="/login"
                className={`px-2 py-0.5 border transition-colors ${
                  isDark
                    ? "border-[#383e47] bg-[#181b1f] text-[#e6e8eb] hover:bg-[#282e37]"
                    : "border-[#c5c6cb] bg-white text-black hover:bg-[#e9e8e3]"
                }`}
              >
                [?: SIGN IN]
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
