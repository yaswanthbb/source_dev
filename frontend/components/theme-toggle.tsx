'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`fixed top-2.5 right-14 sm:top-4 sm:right-6 z-40 p-2 sm:p-2.5 rounded-xl border border-border bg-surface/90 backdrop-blur-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent group ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-4 h-4 sm:w-4.5 sm:h-4.5">
        <Sun
          className={`w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber transition-all duration-300 absolute inset-0 ${
            isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0 pointer-events-none'
          }`}
          aria-hidden="true"
        />
        <Moon
          className={`w-4 h-4 sm:w-4.5 sm:h-4.5 text-accent transition-all duration-300 absolute inset-0 ${
            isDark
              ? 'opacity-0 rotate-90 scale-0 pointer-events-none'
              : 'opacity-100 rotate-0 scale-100'
          }`}
          aria-hidden="true"
        />
      </div>
    </button>
  );
}
