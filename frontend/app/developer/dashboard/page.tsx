"use client";

import dynamic from "next/dynamic";
import { useUiMode } from "@/providers/ui-mode-provider";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import { GuiDeveloperDashboard } from "@/components/dashboard/gui-dashboard";

const CliDashboard = dynamic(() => import("./cli-dashboard"), {
  loading: () => <ModeAwareLoader />,
});

export default function DeveloperDashboardPage() {
  const { mode, ready } = useUiMode();
  if (!ready) return <ModeAwareLoader />;
  return mode === "cli" ? <CliDashboard /> : <GuiDeveloperDashboard />;
}
