"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { useUiMode } from "@/providers/ui-mode-provider";
import { GuiPageLoader } from "@/components/gui/gui-page-loader";
import { MinimalTerminalLoader } from "./minimal-terminal-loader";

type Props = ComponentProps<typeof MinimalTerminalLoader> & {
  guiTitle?: string;
  guiDescription?: string;
};

/** Shared route and auth-guard feedback. CLI alone owns the legacy boot timers. */
export function ModeAwareLoader({
  guiTitle,
  guiDescription,
  isAsyncComplete = true,
  onComplete,
  ...terminalProps
}: Props) {
  const { mode, ready } = useUiMode();
  const completed = useRef(false);
  useEffect(() => {
    if (
      ready &&
      mode === "gui" &&
      isAsyncComplete &&
      onComplete &&
      !completed.current
    ) {
      completed.current = true;
      onComplete();
    }
  }, [ready, mode, isAsyncComplete, onComplete]);

  // Wait for the existing provider instead of guessing the user's appearance.
  if (!ready) return null;
  if (mode === "cli")
    return (
      <MinimalTerminalLoader
        {...terminalProps}
        isAsyncComplete={isAsyncComplete}
        onComplete={onComplete}
      />
    );
  return (
    <GuiPageLoader
      title={guiTitle}
      description={guiDescription}
      inline={terminalProps.inline}
    />
  );
}
