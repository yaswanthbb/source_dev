import type {
  FetchReport,
  LineKind,
  LineSegment,
  TerminalAction,
} from "./commands";
import { clearLearningCache } from "./learning-commands";
import { clearHistory } from "./output";
import { clearVfsCache } from "./resolve-location";

export interface ConsoleEntry {
  id: number;
  kind: LineKind;
  text: string;
  /** Inline `[label]` tokens printed at the end of this line. */
  actions?: TerminalAction[];
  /** A line whose runnable words sit *inside* the sentence rather than as
   *  tokens after it — what `io.say` prints. When set, the host renders these
   *  in order and ignores `text`/`actions`. */
  segments?: LineSegment[];
  /** Set when `text` is markdown the host should flow rather than print
   *  verbatim — a lesson body or an answer. */
  markdown?: boolean;
  /** Set when this line is a `neofetch` block: the mark, the identity, and the
   *  facts beside it. The host draws it; `text` is the plain reading kept for
   *  anything that reads the buffer rather than looks at it. */
  report?: FetchReport;
  /** Set while the boot script is still typing this line, so the caret sits at
   *  the end of it instead of at the prompt below. */
  typing?: boolean;
  /** The prompt path this line was printed at, for an echoed command. Recorded
   *  rather than read at render time so scrollback stays truthful: a `cd` line
   *  keeps the directory it was typed in, not the one it moved to. */
  path?: string;
  /** How long after its screen appeared this line should start revealing, in
   *  milliseconds. Stamped when the line is printed — see `pushEntry` — so the
   *  decision is made once, by the code that knows the output arrived as a
   *  burst, and a re-render never re-animates a line that is already read. */
  delay?: number;
}

/** One command's output, start to finish. The shell shows exactly one of these
 *  at a time — `command` is the line that produced it, kept so [back] can say
 *  where it is going. */
export interface Screen {
  id: number;
  command: string;
  /** The prompt path the command was typed at — see `ConsoleEntry.path`. */
  path?: string;
  lines: ConsoleEntry[];
}

// Nothing about a session is stored. The shell shows one command's output at a
// time and moves with [back] / [next]; a transcript that grows forever is the
// mess this replaced, and a stored one would also outlive the sign-out it was
// typed in. Only the handoff below survives a navigation, and only until read.
let queuedCommand: string | null = null;

export function queueTerminalCommand(command: string) {
  queuedCommand = command;
}

export function takeTerminalCommand() {
  const command = queuedCommand;
  queuedCommand = null;
  return command;
}

/** Called from every sign-out path. One student's cached threads must never
 *  be visible to whoever signs in next on the same machine. */
export function clearTerminalSessions() {
  queuedCommand = null;
  clearLearningCache();
  // The history is a transcript of what one person typed, and the filesystem
  // cache holds their progress markers. Neither may survive into the next
  // session on a shared machine.
  clearHistory();
  clearVfsCache();
}
