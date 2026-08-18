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
      className={`p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-all cursor-pointer hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-accent group ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-4 h-4">
        <Sun
          className={`w-4 h-4 text-amber transition-all duration-300 absolute inset-0 ${
            isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0 pointer-events-none'
          }`}
          aria-hidden="true"
        />
        <Moon
          className={`w-4 h-4 text-accent transition-all duration-300 absolute inset-0 ${
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
