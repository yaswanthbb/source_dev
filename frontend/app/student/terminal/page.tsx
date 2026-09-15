import { TerminalWorkspace } from "@/components/terminal/terminal-workspace";

/** Ids and slugs only — no spaces, no quotes, nothing the tokeniser could
 *  read as a second argument. */
const SAFE_REFERENCE = /^[A-Za-z0-9_-]{1,64}$/;

/** The URL may pick from this allowlist and nothing else. The verb is always
 *  a literal written here; the only thing a link contributes is one reference
 *  that has to match SAFE_REFERENCE first. Arbitrary typed commands arrive
 *  through the in-memory handoff from the dashboard's own form instead. */
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
  if (concept && SAFE_REFERENCE.test(concept)) return `read ${concept}`;
  if (roadmap && SAFE_REFERENCE.test(roadmap)) return `open ${roadmap}`;
  if (view === "roadmaps" || view === "review" || view === "qa") return view;
  return undefined;
}

export default async function StudentTerminalPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; concept?: string; roadmap?: string }>;
}) {
  const params = await searchParams;
  return <TerminalWorkspace initialCommand={openingCommand(params)} />;
}
