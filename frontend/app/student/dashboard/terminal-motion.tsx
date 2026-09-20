"use client";

import { useCallback, useEffect, useState } from "react";

const MOTION_KEY = "sd_dashboard_motion";
const DECODE_GLYPHS = "01_:/·";

/** One frame of the decode: real characters up to `revealed`, glyphs after.
 *  Whitespace always stays put so the string never changes width. */
function decodeFrame(text: string, step: number, revealed: number): string {
  return Array.from(text, (char, index) =>
    index < revealed || /\s/.test(char)
      ? char
      : DECODE_GLYPHS[(index + step) % DECODE_GLYPHS.length],
  ).join("");
}

/** Honor the OS preference and remember the dashboard's own motion switch. */
export function useTerminalMotion() {
  const [reducedMotion, setReducedMotion] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    try {
      setPaused(localStorage.getItem(MOTION_KEY) === "off");
    } catch {
      // Storage is optional; the switch still works for this visit.
    }
    return () => media.removeEventListener("change", sync);
  }, []);

  const toggleMotion = useCallback(() => {
    const next = !paused;
    setPaused(next);
    try {
      localStorage.setItem(MOTION_KEY, next ? "off" : "on");
    } catch {
      // Storage can be unavailable in private browsing.
    }
  }, [paused]);

  return { motionEnabled: !reducedMotion && !paused, reducedMotion, toggleMotion };
}

/** A brief decoding pass; assistive technology receives only the real value. */
export function TerminalReadout({
  text,
  enabled,
}: {
  text: string;
  enabled: boolean;
}) {
  const [frame, setFrame] = useState({ source: text, value: text });

  // Seed the first scrambled frame *during* the render that brings new text,
  // not from the effect afterwards. The effect runs after paint, so seeding
  // there let the real value show for one frame before it scrambled — the
  // number flashed, then decoded to what had already been read. Adjusting
  // state during render is React's documented answer to exactly this.
  if (frame.source !== text) {
    const scramble = enabled && text !== "--";
    setFrame({ source: text, value: scramble ? decodeFrame(text, 0, 0) : text });
  }

  useEffect(() => {
    if (!enabled || text === "--") return;
    let request = 0;
    let start: number | undefined;
    let previousStep = -1;

    const decode = (now: number) => {
      start ??= now;
      const progress = Math.min((now - start) / 640, 1);
      const step = Math.floor((now - start) / 40);
      if (step !== previousStep || progress === 1) {
        previousStep = step;
        const revealed = Math.floor(progress * text.length);
        setFrame({
          source: text,
          value: progress === 1 ? text : decodeFrame(text, step, revealed),
        });
      }
      if (progress < 1) request = requestAnimationFrame(decode);
    };
    request = requestAnimationFrame(decode);
    return () => cancelAnimationFrame(request);
  }, [text, enabled]);

  return (
    <span className="sd-readout">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{frame.value}</span>
    </span>
  );
}
