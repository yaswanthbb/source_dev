import { TerminalWorkspace } from "@/components/terminal/terminal-workspace";

/** Ids only — no spaces, no quotes, nothing the tokeniser could read twice. */
const SAFE_REFERENCE = /^[A-Za-z0-9_-]{1,64}$/;

/** Dashboard deep-links land as the matching command, same as the student
 *  shell's ?view= links. Anything unlisted opens a bare prompt. */
function openingCommand({
  view,
  ref,
}: {
  view?: string;
  ref?: string;
}): string | undefined {
  const safeRef = ref && SAFE_REFERENCE.test(ref) ? ref : undefined;
  switch (view) {
    case "review":
      return safeRef ? `review show ${safeRef}` : "review queue";
    case "users":
      return "users";
    case "notify":
      return "notifications --unread";
    case "jobs":
      return "jobs";
    case "articles":
      return "articles";
    case "quota":
      return "quota";
    case "overview":
      return "overview";
    default:
      return undefined;
  }
}

export default async function AdminTerminalPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; ref?: string }>;
}) {
  const params = await searchParams;
  // Only plain strings cross into the client shell — never command objects.
  return (
    <TerminalWorkspace
      commandsRole="admin"
      initialCommand={openingCommand(params)}
    />
  );
}
