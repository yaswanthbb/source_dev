"use client";

import { GuiAccountForm } from "./gui-account-form";

export function GuiLogin({ onSwitchToCli }: { onSwitchToCli: () => void }) {
  return <GuiAccountForm kind="login" onSwitchToCli={onSwitchToCli} />;
}
