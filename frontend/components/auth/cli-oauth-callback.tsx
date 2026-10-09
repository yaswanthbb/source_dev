"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import type { User } from "@/lib/auth";
import { dashboardFor } from "@/lib/sign-in";
import { ThemeToggle } from "@/components/theme-toggle";
import { CenteredTerminalLoader } from "@/components/loaders/centered-terminal-loader";

/** Preserve the terminal presentation; the route owns verification in both modes. */
export function CliOAuthCallback({
  problem,
  user,
}: {
  problem?: string;
  user: User | null;
}) {
  const router = useRouter();
  if (problem)
    return (
      <div className="min-h-screen bg-bg flex flex-col justify-between">
        <header className="w-full border-b border-border bg-surface px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center py-1">
            <Image
              src="/logo.png"
              alt="source:dev logo"
              width={130}
              height={40}
              className="h-8 sm:h-10 w-auto object-contain"
              priority
              unoptimized
            />
          </Link>
          <ThemeToggle />
        </header>
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full">
          <div
            className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-sm p-6 sm:p-8 text-center"
            role="alert"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold font-display text-text-primary mb-2">
              Authentication Error
            </h1>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              {problem}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-accent hover:bg-accent/90 text-white font-medium rounded-xl text-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Return to Sign in
            </Link>
          </div>
        </main>
        <footer className="py-4 text-center text-xs text-text-secondary">
          &copy; {new Date().getFullYear()} source:dev. All rights reserved.
        </footer>
      </div>
    );
  return (
    <CenteredTerminalLoader
      portal={user?.role === "admin" ? "admin" : "student"}
      minDuration={5000}
      isAsyncComplete={!!user}
      onComplete={() => {
        if (user) router.replace(dashboardFor(user.role));
      }}
    />
  );
}
