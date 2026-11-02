"use client";

import type { ReactNode, Ref } from "react";
import { AlertCircle, Check, Info, LoaderCircle, X } from "lucide-react";
import styles from "./gui-feedback.module.css";

export function GuiFeedback({
  kind,
  title,
  children,
  onDismiss,
  ref,
}: {
  kind: "error" | "success" | "info" | "loading";
  title: string;
  children?: ReactNode;
  onDismiss?: () => void;
  ref?: Ref<HTMLDivElement>;
}) {
  const Icon = {
    error: AlertCircle,
    success: Check,
    info: Info,
    loading: LoaderCircle,
  }[kind];
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={kind === "error" ? "alert" : "status"}
      aria-atomic="true"
      className={`${styles.notice} ${styles[kind] ?? ""}`}
    >
      <span className={styles.icon}>
        <Icon
          size={19}
          aria-hidden="true"
          className={kind === "loading" ? styles.spin : undefined}
        />
      </span>
      <div className={styles.content}>
        <strong>{title}</strong>
        {children && <div className={styles.description}>{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className={styles.dismiss}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
