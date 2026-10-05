import { TerminalWorkspace } from "@/components/terminal/terminal-workspace";

/** Ids and slugs only — no spaces, no quotes, nothing the tokeniser could
 *  read as a second argument. */
const SAFE_REFERENCE = /^[A-Za-z0-9_-]{1,64}$/;

/** The URL may pick from this allowlist and nothing else. The verb is always
 *  a literal written here; the only thing a link contributes is one reference
 *  that has to match SAFE_REFERENCE first. Arbitrary typed commands arrive
 *  through the in-memory handoff from the dashboard's own form instead.
 *
 *  `read` and `open` are gone — `cat` and `cd` are the one way to read a
 *  lesson and the one way to enter a path. A `?concept=` link still carries an
 *  id rather than a path, which `cat` accepts for exactly this reason; a
 *  `?roadmap=` link does the same through `cd`. */
function openingCommand({
  view,
  concept,
  roadmap,
}: {
  view?: string;
  concept?: string;
  roadmap?: string;
}): string | undefined {
  if (view === "profile") return "profile";
  if (concept && SAFE_REFERENCE.test(concept)) return `cat ${concept}`;
  if (roadmap && SAFE_REFERENCE.test(roadmap)) return `cd ${roadmap}`;
  // The catalogue is the root listing.
  if (view === "roadmaps") return "ls";
  if (view === "review" || view === "qa") return view;
  if (view === "notify") return "notifications --unread";
  return undefined;
}

export default async function DeveloperTerminalPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; concept?: string; roadmap?: string }>;
}) {
  const params = await searchParams;
  // The view decides the registry, never the user role: an admin in the
  // developer shell gets the full developer set (ls, authoring, QA board).
  return <TerminalWorkspace commandsRole="developer" initialCommand={openingCommand(params)} />;
}
