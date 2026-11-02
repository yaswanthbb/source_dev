"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { RetroHomepage } from "@/components/home/retro-homepage";
import { CenteredTerminalLoader } from "@/components/loaders/centered-terminal-loader";
import { GuiHomepage } from "@/components/home/gui-homepage";
import { useUiMode } from "@/providers/ui-mode-provider";
import { Monitor } from "lucide-react";
import gui from "@/components/gui/gui-theme.module.css";
import styles from "@/components/home/gui-homepage.module.css";

export default function RootPage() {
  const router = useRouter();
  const { mode, ready, setMode } = useUiMode();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsRedirecting(true);
      router.replace("/developer/dashboard");
    }
  }, [router]);

  if (isRedirecting) {
    return null;
  }

  if (!ready) return null;

  if (mode === "gui") {
    return (
      <GuiHomepage onSwitchToCli={() => setMode("cli", { navigate: false })} />
    );
  }

  return (
    <>
      {isLoaded ? (
        <RetroHomepage />
      ) : (
        <CenteredTerminalLoader
          portal="homepage"
          minDuration={5000}
          onComplete={() => setIsLoaded(true)}
        />
      )}
      <button
        type="button"
        className={`${gui.theme} ${styles.classicSwitch}`}
        onClick={() => setMode("gui", { navigate: false })}
      >
        <Monitor size={16} /> Switch to GUI
      </button>
    </>
  );
}
