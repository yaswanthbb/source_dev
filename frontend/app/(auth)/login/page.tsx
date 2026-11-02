"use client";

import { useUiMode } from "@/providers/ui-mode-provider";
import { CliLogin } from "@/components/auth/cli-login";
import { GuiLogin } from "@/components/auth/gui-login";
import { LoginPlaceholder } from "@/components/auth/login-placeholder";

export default function LoginPage() {
  const { mode, ready, setMode } = useUiMode();
  if (!ready) return <LoginPlaceholder />;
  return mode === "cli" ? (
    <CliLogin onSwitchToGui={() => setMode("gui", { navigate: false })} />
  ) : (
    <GuiLogin onSwitchToCli={() => setMode("cli", { navigate: false })} />
  );
}
