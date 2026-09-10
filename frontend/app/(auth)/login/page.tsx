"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";
import { setToken, setUser, User } from "@/lib/auth";
import { useSnackbar } from "@/providers/snackbar-provider";
import { useTheme } from "@/providers/theme-provider";
import { CenteredTerminalLoader } from "@/components/loaders/centered-terminal-loader";
import "@/components/home/retro-terminal.css";

type LoginStage = "EMAIL" | "VERIFYING" | "PASSWORD";

export default function LoginPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { showError } = useSnackbar();

  // Form & Terminal Stage States
  const [stage, setStage] = useState<LoginStage>("EMAIL");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stepIdentityOk, setStepIdentityOk] = useState(false);
  const [stepSecurityOk, setStepSecurityOk] = useState(false);

  // Status & Feedback States
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [streamMessage, setStreamMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bootingUser, setBootingUser] = useState<User | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const verificationTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Focus email input on initial mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Compute consistent deterministic UID from email for authentic UNIX feel
  const getDeterministicUid = useCallback((userEmail: string) => {
    let hash = 0;
    for (let i = 0; i < userEmail.length; i++) {
      hash = (hash << 5) - hash + userEmail.charCodeAt(i);
      hash |= 0;
    }
    return 1000 + (Math.abs(hash) % 8999);
  }, []);

  // Format identity display name from email
  const formatDisplayName = useCallback((userEmail: string) => {
    const local = userEmail.split("@")[0] || "user";
    return local
      .split(/[._-]/)
      .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
      .join(" ");
  }, []);

  const clearTimers = () => {
    verificationTimerRef.current.forEach(clearTimeout);
    verificationTimerRef.current = [];
  };

  const stageRef = useRef<LoginStage>(stage);
  stageRef.current = stage;

  // Clear email input directly (ESC to clear)
  const handleClearEmail = useCallback(() => {
    setEmail("");
    setEmailError(null);
    setServerError(null);
    setStreamMessage(null);
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 20);
  }, []);

  // Reset or abort session (^C / Escape)
  const handleAbortOrReset = useCallback(() => {
    clearTimers();
    if (stageRef.current === "PASSWORD" || stageRef.current === "VERIFYING") {
      // ESC to abort: return to EMAIL stage keeping email for easy editing
      setStage("EMAIL");
      setStepIdentityOk(false);
      setStepSecurityOk(false);
      setPassword("");
      setPasswordError(null);
      setServerError(null);
      setStreamMessage(null);
      setIsSubmitting(false);
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 50);
    } else {
      // stage === 'EMAIL': ESC to clear the email input
      handleClearEmail();
    }
  }, [handleClearEmail]);

  // Global keyboard shortcuts (ESC to clear/abort, ^C to reset/abort)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleAbortOrReset();
      } else if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        handleAbortOrReset();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAbortOrReset]);

  // Stage 1: Validate Email and trigger sequential reveal
  const handleValidateEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setEmailError(null);
    setServerError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Identity required. Enter username/email.");
      emailInputRef.current?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError("Invalid identity format. Enter a valid email address.");
      emailInputRef.current?.focus();
      return;
    }

    // Begin sequential validation text reveal
    setStage("VERIFYING");
    setStepIdentityOk(false);
    setStepSecurityOk(false);
    setStreamMessage("Resolving identity signature & security profile...");

    clearTimers();

    // Step 1: Identity line appears
    const timer1 = setTimeout(() => {
      setStepIdentityOk(true);
    }, 220);

    // Step 2: Security policy line appears
    const timer2 = setTimeout(() => {
      setStepSecurityOk(true);
      setStreamMessage(null);
    }, 480);

    // Step 3: Transition to PASSWORD stage and focus input
    const timer3 = setTimeout(() => {
      setStage("PASSWORD");
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 50);
    }, 720);

    verificationTimerRef.current = [timer1, timer2, timer3];
  };

  // Stage 2: Submit credentials and authenticate
  const handleSubmitCredentials = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setPasswordError(null);
    setServerError(null);

    if (!password || password.length < 8) {
      setPasswordError("Authentication token must be at least 8 characters.");
      passwordInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setStreamMessage(
      `Verifying ed25519 signature & root credentials for ${email}...`,
    );

    try {
      const response = await apiClient.post<{
        accessToken: string;
        user: User;
      }>("/auth/login", {
        email: email.trim(),
        password,
      });

      const { accessToken, user } = response.data;
      setToken(accessToken);
      setUser(user);

      // Mark that user just logged in so subsequent dashboard loader is bypassed
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("kip_just_logged_in", String(Date.now()));
        } catch {}
      }

      setStreamMessage(
        "SESSION_GRANTED: Access token issued. Initializing shell environment...",
      );

      // Transition to CenteredTerminalLoader after brief confirmation
      setTimeout(() => {
        setBootingUser(user);
      }, 280);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const axiosError = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const backendMessage = axiosError.response?.data?.message;
      let errorText = "Invalid credentials. Access challenge rejected.";

      if (Array.isArray(backendMessage)) {
        errorText = backendMessage.join(", ");
      } else if (typeof backendMessage === "string") {
        errorText = backendMessage;
      }

      setServerError(errorText);
      setStreamMessage(null);
      showError(errorText);
      passwordInputRef.current?.focus();
    }
  };

  const getDashboardRoute = (role: User["role"]) => {
    switch (role) {
      case "student":
        return "/student/dashboard";
      case "instructor":
        return "/instructor/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/student/dashboard";
    }
  };

  // If credentials verified, show the 5-second centered terminal loader
  if (bootingUser) {
    return (
      <CenteredTerminalLoader
        portal={bootingUser.role}
        minDuration={5000}
        onComplete={() => {
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem("kip_just_logged_in", String(Date.now()));
            } catch {}
          }
          const targetRoute = getDashboardRoute(bootingUser.role);
          router.replace(targetRoute);
        }}
      />
    );
  }

  const derivedUid = getDeterministicUid(email || "user@kip.dev");
  const displayName = formatDisplayName(email || "user");

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
          color: isDark ? "#e2e2e5" : "#1b1c19",
        }}
      >
        {/* ====================================================================
            TOP NAVBAR (Exact match to Homepage Retro Navigation)
            ==================================================================== */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 h-14 w-full px-4 md:px-6 flex items-center justify-between border-b backdrop-blur-sm transition-colors duration-200 ${
            isDark
              ? "bg-[#111417]/95 border-[#383e47]"
              : "bg-[#faf9f4]/95 border-black/20"
          }`}
        >
          {/* Brand & System Status */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <span
                className={`w-2.5 h-2.5 inline-block ${isDark ? "bg-[#e6e8eb]" : "bg-black"}`}
              />
              <span
                className={`font-mono text-sm font-bold tracking-tight uppercase ${
                  isDark ? "text-[#e6e8eb]" : "text-black"
                }`}
              >
                KIP // KNOWLEDGE IS POWER
              </span>
            </Link>

            <span
              className={`text-xs px-2 py-0.5 border uppercase font-mono ${
                isDark
                  ? "border-[#383e47] bg-[#181b1f] text-[#56d364]"
                  : "border-black/40 bg-[#f5f4ef] text-black"
              }`}
            >
              [SYS: OK]
            </span>
          </div>

          {/* Right Mode Toggle & Register Link */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle light/dark mode"
              title={`Toggle Mode: currently ${isDark ? "Dark" : "Light"}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold tracking-wider cursor-pointer select-none transition-none ${
                isDark
                  ? "text-[#e6e8eb] bg-[#14171b] border border-[#383e47] hover:border-[#e6e8eb] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.6)]"
                  : "text-black bg-white border border-black hover:bg-[#e9e8e3] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              <span
                className={`w-2 h-2 inline-block ${isDark ? "bg-[#56d364]" : "bg-black"}`}
              />
              <span>{isDark ? "[MODE: DK]" : "[MODE: LT]"}</span>
            </button>

            <Link
              href="/register"
              className={`inline-flex text-xs px-3 py-1 border uppercase font-mono transition-colors ${
                isDark
                  ? "border-[#383e47] bg-[#14171b] text-[#e6e8eb] hover:bg-[#1e2227]"
                  : "border-[#c5c6cb] bg-[#f5f4ef] text-black hover:bg-[#e9e8e3]"
              }`}
            >
              [REG: NEW_USER]
            </Link>
          </div>
        </header>

        {/* ====================================================================
            MAIN VIEWPORT: CENTERED TERMINAL LOGIN WINDOW
            ==================================================================== */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full pt-20 pb-16">
          <div className="w-full max-w-xl flex flex-col font-mono">
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
                    className={`inline-block w-2.5 h-2.5 ${
                      isDark ? "bg-[#56d364]" : "bg-[#b45309]"
                    }`}
                  />
                  <span className="text-[13px] font-bold tracking-wide truncate">
                    KIP // TTY_LOGIN_v2.4
                  </span>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span
                    className={`text-[11px] px-1.5 py-0.5 border font-medium ${
                      isDark
                        ? "bg-[#1e2022] border-[#333537] text-[#56d364]"
                        : "bg-[#f5f4ef] border-[#c5c6cb] text-[#b45309]"
                    }`}
                  >
                    [SEC: 0x4]
                  </span>
                  <span
                    className={`text-[11px] px-1.5 py-0.5 border font-medium hidden sm:inline-block ${
                      isDark
                        ? "bg-[#1e2022] border-[#333537] text-[#c4c7c9]"
                        : "bg-[#f5f4ef] border-[#c5c6cb] text-[#45474a]"
                    }`}
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
                {/* Main Editor Card */}
                <div
                  className={`p-3.5 sm:p-4 text-xs sm:text-[13px] space-y-3.5 border ${
                    isDark
                      ? "bg-[#0c0e10] border-[#333537] text-[#e2e2e5]"
                      : "bg-[#ffffff] border-[#e3e3de] text-[#1b1c19]"
                  }`}
                >
                  {/* ASCII Art Logo */}
                  <pre
                    className={`leading-none overflow-hidden select-none font-bold text-xs sm:text-[13px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                      isDark ? "text-white" : "text-[#1b1c19]"
                    }`}
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
                    className={`border-b pb-2 space-y-1 ${
                      isDark ? "border-[#333537]" : "border-[#e3e3de]"
                    }`}
                  >
                    <p
                      className={`font-bold tracking-wide uppercase ${
                        isDark ? "text-white" : "text-[#1b1c19]"
                      }`}
                    >
                      KNOWLEDGE IS POWER // CORE ARCHITECTURE DAEMON
                    </p>
                    <p
                      className={`text-[11px] ${
                        isDark ? "text-[#c4c7c9]" : "text-[#45474a]"
                      }`}
                    >
                      Session: tty1 :: Connected: 127.0.0.1
                      (ed25519-sha2-nistp256)
                    </p>
                  </div>

                  {/* ==========================================================
                      INTERACTIVE TERMINAL PROMPTS (Email then Password)
                      ========================================================== */}
                  <form
                    onSubmit={
                      stage === "PASSWORD"
                        ? handleSubmitCredentials
                        : handleValidateEmail
                    }
                    className="space-y-3"
                    noValidate
                  >
                    {/* Stage 1: Username / Email Prompt */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label
                          htmlFor="terminal-user"
                          className={`font-medium select-none whitespace-nowrap cursor-pointer ${
                            isDark ? "text-[#c2c7cf]" : "text-[#45474a]"
                          }`}
                        >
                          kip-auth login:
                        </label>

                        {stage === "EMAIL" ? (
                          <div
                            className="relative flex items-center flex-1 min-w-[200px] cursor-text"
                            onClick={() => emailInputRef.current?.focus()}
                          >
                            <span
                              className={`font-bold tracking-wide text-xs sm:text-[13px] whitespace-pre select-none ${
                                isDark ? "text-white" : "text-[#1b1c19]"
                              }`}
                            >
                              {email}
                            </span>
                            <span
                              aria-hidden="true"
                              className={`retro-terminal-cursor !w-[9px] !h-[18px] ${
                                isDark ? "text-[#56d364]" : "text-[#b45309]"
                              }`}
                            />
                            <input
                              id="terminal-user"
                              type="email"
                              autoComplete="email"
                              autoFocus
                              ref={emailInputRef}
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (emailError) setEmailError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleClearEmail();
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 pointer-events-auto cursor-text caret-transparent p-0 m-0 border-none bg-transparent"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold tracking-wide ${
                                isDark ? "text-white" : "text-[#1b1c19]"
                              }`}
                            >
                              {email}
                            </span>
                            <button
                              type="button"
                              onClick={handleAbortOrReset}
                              className={`text-[10px] uppercase font-mono px-1.5 py-0.5 border cursor-pointer transition-colors ${
                                isDark
                                  ? "border-[#333537] bg-[#1e2022] text-[#c4c7c9] hover:bg-[#282a2c] hover:text-white"
                                  : "border-[#c5c6cb] bg-[#f5f4ef] text-[#45474a] hover:bg-[#e3e3de]"
                              }`}
                            >
                              [EDIT]
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Email Error Feedback */}
                      {emailError && (
                        <p className="text-[11px] text-red-500 font-medium pl-1 animate-in fade-in duration-150">
                          [ERR_INVALID_IDENTITY]: {emailError}
                        </p>
                      )}

                      {/* Animated Step-by-Step Identity Output Lines */}
                      {(stepIdentityOk || stepSecurityOk) && (
                        <div
                          className={`text-[11px] pl-2 space-y-1 pt-1 ${
                            isDark ? "text-[#c2c7cf]" : "text-[#45474a]"
                          }`}
                        >
                          {stepIdentityOk && (
                            <p className="animate-in fade-in slide-in-from-left-2 duration-150">
                              <span
                                className={`font-bold ${
                                  isDark ? "text-[#56d364]" : "text-[#b45309]"
                                }`}
                              >
                                [OK]
                              </span>{" "}
                              <span
                                className={
                                  isDark ? "text-white" : "text-[#1b1c19]"
                                }
                              >
                                Identity verified:
                              </span>{" "}
                              {displayName} &lt;{email}&gt; (UID: {derivedUid})
                            </p>
                          )}

                          {stepSecurityOk && (
                            <p className="animate-in fade-in slide-in-from-left-2 duration-150 delay-75">
                              <span
                                className={`font-bold ${
                                  isDark ? "text-[#56d364]" : "text-[#b45309]"
                                }`}
                              >
                                [OK]
                              </span>{" "}
                              <span
                                className={
                                  isDark ? "text-white" : "text-[#1b1c19]"
                                }
                              >
                                Security policy:
                              </span>{" "}
                              ed25519 hardware key or root password required
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stage 2: Password Prompt (Revealed only after validation text finishes) */}
                    {stage === "PASSWORD" && (
                      <div className="space-y-1.5 pt-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label
                            htmlFor="terminal-token"
                            className={`whitespace-nowrap font-medium select-none cursor-pointer ${
                              isDark ? "text-[#c2c7cf]" : "text-[#45474a]"
                            }`}
                          >
                            Password for {email.split("@")[0]}:
                          </label>

                          <div
                            className="relative flex items-center flex-1 min-w-[180px] cursor-text"
                            onClick={() => passwordInputRef.current?.focus()}
                          >
                            <span
                              className={`font-bold text-xs sm:text-[13px] select-none tracking-widest whitespace-pre ${
                                isDark ? "text-white" : "text-[#1b1c19]"
                              }`}
                            >
                              {showPassword
                                ? password
                                : "•".repeat(password.length)}
                            </span>
                            <span
                              aria-hidden="true"
                              className={`retro-terminal-cursor !w-[9px] !h-[18px] ${
                                isDark ? "text-[#56d364]" : "text-[#b45309]"
                              }`}
                            />
                            <input
                              id="terminal-token"
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              ref={passwordInputRef}
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (passwordError) setPasswordError(null);
                                if (serverError) setServerError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAbortOrReset();
                                }
                              }}
                              disabled={isSubmitting}
                              className="absolute inset-0 w-full h-full opacity-0 pointer-events-auto cursor-text caret-transparent p-0 m-0 border-none bg-transparent"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPassword(!showPassword);
                              setTimeout(
                                () => passwordInputRef.current?.focus(),
                                10,
                              );
                            }}
                            title={
                              showPassword ? "Hide password" : "Show password"
                            }
                            className={`text-[10px] uppercase font-mono px-1.5 py-0.5 border flex-shrink-0 cursor-pointer transition-colors ml-1 ${
                              isDark
                                ? "border-[#333537] bg-[#1e2022] text-[#c4c7c9] hover:bg-[#282a2c] hover:text-white"
                                : "border-[#c5c6cb] bg-[#f5f4ef] text-[#45474a] hover:bg-[#e3e3de]"
                            }`}
                          >
                            {showPassword ? "[HIDE]" : "[SHOW]"}
                          </button>
                        </div>

                        {passwordError && (
                          <p className="text-[11px] text-red-500 font-medium pl-1 animate-in fade-in duration-150">
                            [ERR_INVALID_CREDENTIAL]: {passwordError}
                          </p>
                        )}

                        <p
                          className={`text-[11px] pl-1 ${
                            isDark ? "text-[#8e9194]" : "text-[#75777b]"
                          }`}
                        >
                          [ Press{" "}
                          <span
                            className={
                              isDark ? "text-[#56d364]" : "text-[#b45309]"
                            }
                          >
                            ENTER
                          </span>{" "}
                          to authenticate |{" "}
                          <span
                            className={
                              isDark ? "text-[#56d364]" : "text-[#b45309]"
                            }
                          >
                            ESC
                          </span>{" "}
                          to abort ]
                        </p>
                      </div>
                    )}

                    {/* Hidden submit trigger to catch Enter key inside form */}
                    <button
                      type="submit"
                      className="hidden"
                      aria-hidden="true"
                    />
                  </form>

                  {/* Stage 1 Helper Hint when typing email */}
                  {stage === "EMAIL" && (
                    <p
                      className={`text-[11px] pl-1 ${
                        isDark ? "text-[#8e9194]" : "text-[#75777b]"
                      }`}
                    >
                      [ Press{" "}
                      <span
                        className={isDark ? "text-[#56d364]" : "text-[#b45309]"}
                      >
                        ENTER
                      </span>{" "}
                      to validate identity |{" "}
                      <span
                        className={isDark ? "text-[#56d364]" : "text-[#b45309]"}
                      >
                        ESC
                      </span>{" "}
                      to clear ]
                    </p>
                  )}

                  {/* Live Stream / Error Console Box */}
                  {(streamMessage || serverError) && (
                    <div
                      className={`p-2 border text-[11px] space-y-1 animate-in fade-in duration-150 ${
                        serverError
                          ? isDark
                            ? "bg-[#281313] border-red-800 text-red-300"
                            : "bg-red-50 border-red-300 text-red-700"
                          : isDark
                            ? "bg-[#1e2022] border-[#333537] text-[#56d364]"
                            : "bg-[#f5f4ef] border-[#c5c6cb] text-[#b45309]"
                      }`}
                    >
                      {serverError ? (
                        <div className="flex items-start gap-1.5">
                          <span className="font-bold text-red-500 flex-shrink-0">
                            [AUTH_FAILURE]:
                          </span>
                          <span>{serverError}</span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5">
                          <span
                            className={`font-bold flex-shrink-0 ${
                              isDark ? "text-[#56d364]" : "text-[#b45309]"
                            }`}
                          >
                            [SYS_STREAM]:
                          </span>
                          <span className="animate-pulse">{streamMessage}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Alternatively: OAuth SSO Options */}
                  <div
                    className={`border-t pt-2.5 space-y-2 ${
                      isDark ? "border-[#333537]" : "border-[#e3e3de]"
                    }`}
                  >
                    <p
                      className={`text-[11px] font-medium ${
                        isDark ? "text-[#8e9194]" : "text-[#45474a]"
                      }`}
                    >
                      Alternatively:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`${
                          process.env.NEXT_PUBLIC_API_URL ||
                          "http://localhost:3000"
                        }/auth/google`}
                        className={`text-left px-2.5 py-1 border transition-colors text-[11px] flex items-center space-x-2 cursor-pointer ${
                          isDark
                            ? "bg-[#1e2022] hover:bg-[#333537] text-[#c2c7cf] hover:text-white border-[#333537]"
                            : "bg-[#f5f4ef] hover:bg-[#e9e8e3] text-[#1b1c19] border-[#c5c6cb]"
                        }`}
                      >
                        <span className="font-bold">
                          <span
                            className={
                              isDark ? "text-[#56d364]" : "text-[#b45309]"
                            }
                          >
                            [1]
                          </span>{" "}
                          Google SSO
                        </span>
                        <span
                          className={
                            isDark ? "text-[#8e9194]" : "text-[#75777b]"
                          }
                        >
                          (kip auth -g)
                        </span>
                      </a>

                      <a
                        href={`${
                          process.env.NEXT_PUBLIC_API_URL ||
                          "http://localhost:3000"
                        }/auth/github`}
                        className={`text-left px-2.5 py-1 border transition-colors text-[11px] flex items-center space-x-2 cursor-pointer ${
                          isDark
                            ? "bg-[#1e2022] hover:bg-[#333537] text-[#c2c7cf] hover:text-white border-[#333537]"
                            : "bg-[#f5f4ef] hover:bg-[#e9e8e3] text-[#1b1c19] border-[#c5c6cb]"
                        }`}
                      >
                        <span className="font-bold">
                          <span
                            className={
                              isDark ? "text-[#56d364]" : "text-[#b45309]"
                            }
                          >
                            [2]
                          </span>{" "}
                          GitHub OAuth
                        </span>
                        <span
                          className={
                            isDark ? "text-[#8e9194]" : "text-[#75777b]"
                          }
                        >
                          (kip auth -gh)
                        </span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Bottom Window Control / Shortcut Links */}
                <div className="flex flex-col space-y-1.5 pt-0.5">
                  <div
                    className={`flex items-center justify-between text-[11px] px-1 select-none font-medium ${
                      isDark ? "text-[#c4c7c9]" : "text-[#45474a]"
                    }`}
                  >
                    {stage === "PASSWORD" ? (
                      <button
                        type="button"
                        onClick={handleSubmitCredentials}
                        disabled={isSubmitting}
                        className="hover:underline transition-colors cursor-pointer"
                      >
                        <span
                          className={`font-bold ${isDark ? "text-[#56d364]" : "text-[#b45309]"}`}
                        >
                          [ENTER]
                        </span>{" "}
                        <span
                          className={isDark ? "text-white" : "text-[#1b1c19]"}
                        >
                          SUBMIT_CREDENTIALS
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleValidateEmail}
                        className="hover:underline transition-colors cursor-pointer"
                      >
                        <span
                          className={`font-bold ${isDark ? "text-[#56d364]" : "text-[#b45309]"}`}
                        >
                          [ENTER]
                        </span>{" "}
                        <span
                          className={isDark ? "text-white" : "text-[#1b1c19]"}
                        >
                          VALIDATE_IDENTITY
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleAbortOrReset}
                      className="hover:underline transition-colors cursor-pointer"
                    >
                      <span
                        className={`font-bold ${isDark ? "text-[#56d364]" : "text-[#b45309]"}`}
                      >
                        [^C]
                      </span>{" "}
                      <span
                        className={isDark ? "text-[#c2c7cf]" : "text-[#1b1c19]"}
                      >
                        RESET / ABORT
                      </span>
                    </button>

                    <Link
                      href="/register"
                      className="hover:underline transition-colors cursor-pointer"
                    >
                      <span
                        className={`font-bold ${isDark ? "text-[#56d364]" : "text-[#b45309]"}`}
                      >
                        [TAB]
                      </span>{" "}
                      <span
                        className={isDark ? "text-white" : "text-[#1b1c19]"}
                      >
                        CREATE_ACCOUNT
                      </span>
                    </Link>
                  </div>

                  <div
                    className={`flex items-center justify-between text-[10px] px-1 ${
                      isDark ? "text-[#8e9194]" : "text-[#75777b]"
                    }`}
                  >
                    <Link
                      href="/forgot-password"
                      className="hover:underline transition-colors"
                    >
                      <span
                        className={`font-bold ${isDark ? "text-[#56d364]" : "text-[#b45309]"}`}
                      >
                        [?]
                      </span>{" "}
                      <span>FORGOT_PASSWORD</span>
                    </Link>
                    <span>SESSION_ENCODING: UTF-8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ====================================================================
            BOTTOM NAVBAR / FOOTER (Exact match to Homepage Retro Navigation)
            ==================================================================== */}
        <footer
          className={`w-full border-t transition-colors duration-200 ${
            isDark
              ? "bg-[#14171b] border-[#2a2e34]"
              : "bg-[#f5f4ef] border-black/20"
          }`}
        >
          <div className="w-full px-4 md:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div
              className={`font-mono uppercase tracking-wider ${
                isDark ? "text-[#8b939e]" : "text-[#45474a]"
              }`}
            >
              KIP © 2026 • ZERO COOKIES • ZERO TRACKERS
            </div>

            <div
              className={`flex items-center gap-2 font-mono uppercase ${
                isDark ? "text-[#cbd0d6]" : "text-black"
              }`}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full animate-pulse ${
                  isDark ? "bg-[#56d364]" : "bg-[#fe932c]"
                }`}
              />
              <span>● DAEMON RUNNING // LATENCY &lt; 4ms</span>
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
                href="/register"
                className={`px-2 py-0.5 border transition-colors ${
                  isDark
                    ? "border-[#383e47] bg-[#181b1f] text-[#e6e8eb] hover:bg-[#282e37]"
                    : "border-[#c5c6cb] bg-white text-black hover:bg-[#e9e8e3]"
                }`}
              >
                [?: SIGN UP]
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
