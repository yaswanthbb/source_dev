"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type SnackbarVariant = "success" | "error";

export interface SnackbarState {
  id: number;
  message: string;
  variant: SnackbarVariant;
  duration: number;
}

export interface SnackbarContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  dismiss: () => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSnackbar(null);
  }, []);

  const showMessage = useCallback(
    (message: string, variant: SnackbarVariant, duration: number) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const id = Date.now();
      setSnackbar({ id, message, variant, duration });

      timerRef.current = setTimeout(() => {
        setSnackbar((current) => (current?.id === id ? null : current));
      }, duration);
    },
    [],
  );

  const showSuccess = useCallback(
    (message: string) => {
      showMessage(message, "success", 4000);
    },
    [showMessage],
  );

  const showError = useCallback(
    (message: string) => {
      showMessage(message, "error", 6000);
    },
    [showMessage],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSuccess, showError, dismiss }}>
      {children}

      {/* Global Single Top-Right Anchored Snack Bar (Below Navbar) */}
      {snackbar && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-30 right-6 z-50 pointer-events-auto max-w-[calc(100vw-3rem)] sm:max-w-lg animate-in slide-in-from-right-5 fade-in duration-200"
        >
          <div
            className={`px-5 py-3.5 rounded-2xl border shadow-xl flex items-center justify-between gap-3.5 text-sm sm:text-base font-semibold backdrop-blur-md transition-all ${
              snackbar.variant === 'success'
                ? 'bg-green-tint/95 border-green/30 text-green shadow-green/10'
                : 'bg-red-tint/95 border-red/30 text-red shadow-red/10'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {snackbar.variant === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red flex-shrink-0" />
              )}
              <span className="truncate leading-snug">{snackbar.message}</span>
            </div>

            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss notification"
              className="p-1.5 text-current/70 hover:text-current rounded-xl hover:bg-black/5 transition-colors cursor-pointer flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </SnackbarContext.Provider>
  );
}
