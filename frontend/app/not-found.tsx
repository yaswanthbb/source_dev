import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between p-6">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link href="/student/dashboard" className="flex items-center">
          <Image
            src="/logo.png?v=2"
            alt="KIS Logo"
            width={140}
            height={44}
            className="h-10 w-auto object-contain"
            priority
            unoptimized
          />
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-md w-full mx-auto text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-accent-tint text-accent flex items-center justify-center mx-auto text-3xl font-bold font-display shadow-xs">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
            Page not found
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            The page you are looking for doesn&apos;t exist or has been moved to another URL.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/student/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>
          <Link
            href="/student/roadmaps"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface border border-border text-text-primary font-semibold text-xs hover:bg-bg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Roadmaps</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-text-secondary">
        &copy; {new Date().getFullYear()} KIS. All rights reserved.
      </footer>
    </div>
  );
}
