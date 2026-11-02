"use client";

import { useUiMode } from "@/providers/ui-mode-provider";
import { CliRegister } from "@/components/auth/cli-register";
import { GuiAccountForm } from "@/components/auth/gui-account-form";
import { LoginPlaceholder } from "@/components/auth/login-placeholder";

export default function RegisterPage() {
  const { mode, ready, setMode } = useUiMode();
  if (!ready) return <LoginPlaceholder title="Preparing sign up" />;
  return mode === "cli" ? (
    <CliRegister onSwitchToGui={() => setMode("gui", { navigate: false })} />
  ) : (
    <GuiAccountForm
      kind="register"
      onSwitchToCli={() => setMode("cli", { navigate: false })}
    />
  );
}
