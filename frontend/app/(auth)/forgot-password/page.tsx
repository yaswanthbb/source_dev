"use client";

import { useUiMode } from "@/providers/ui-mode-provider";
import { CliPasswordRecovery } from "@/components/auth/cli-password-recovery";
import { GuiPasswordRecovery } from "@/components/auth/gui-password-recovery";
import { LoginPlaceholder } from "@/components/auth/login-placeholder";

export default function ForgotPasswordPage() {
  const { ready, mode, setMode } = useUiMode();
  if (!ready) return <LoginPlaceholder title="Preparing account recovery" />;
  return mode === "cli" ? (
    <CliPasswordRecovery
      onSwitchToGui={() => setMode("gui", { navigate: false })}
    />
  ) : (
    <GuiPasswordRecovery
      onSwitchToCli={() => setMode("cli", { navigate: false })}
    />
  );
}
