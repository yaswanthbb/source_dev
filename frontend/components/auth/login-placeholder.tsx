import { GuiPageLoader } from "@/components/gui/gui-page-loader";

export function LoginPlaceholder({
  title = "Preparing sign in",
}: {
  title?: string;
}) {
  return (
    <GuiPageLoader
      title={title}
      description="Loading your interface preference."
    />
  );
}
