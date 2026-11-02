'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '@/providers/theme-provider';
import './terminal-loaders.css';

interface MinimalTerminalLoaderProps {
  minDuration?: number; // minimum duration in milliseconds, default 2000
  isAsyncComplete?: boolean; // external async completion trigger
  onComplete?: () => void;
  inline?: boolean; // if true, renders in a compact card/panel instead of full-page
  stage?: string; // default "STAGE_02"
  title?: string;
}

const STATUS_MESSAGES = [
  'mounting read_only root...',
  'allocating address space...',
  'compiling recall graph...',
  'rebuilding symbol trie...',
  'resolving vector edges...',
  'checksumming memory blocks...',
  'system ready. mounting canvas...',
];

const SPINNER_FRAMES = ['/', '—', '\\', '|'];
const TOTAL_SEGMENTS = 24;

export function MinimalTerminalLoader({
  minDuration = 2000,
  isAsyncComplete = true,
  onComplete,
  inline = false,
  stage = 'STAGE_02',
  title,
}: MinimalTerminalLoaderProps) {
  const { isDark } = useTheme();
  const [progress, setProgress] = useState(12);
  const [statusIdx, setStatusIdx] = useState(0);
  const [spinnerIdx, setSpinnerIdx] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState('0.00');
  const startTimeRef = useRef<number>(Date.now());
  const isCompletedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayTitle = title ? title.toUpperCase() : 'source-dev // SYS_BOOT';

  const [shouldBypass] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const val = sessionStorage.getItem('sd_just_logged_in');
        if (val && Date.now() - parseInt(val, 10) < 30000) {
          return true;
        }
      } catch {}
    }
    return false;
  });

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (shouldBypass) {
      onCompleteRef.current?.();
    }
  }, [shouldBypass]);

  // Rotating ASCII spinner
  useEffect(() => {
    if (shouldBypass) return;
    const spinnerTimer = setInterval(() => {
      setSpinnerIdx((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 120);
    return () => clearInterval(spinnerTimer);
  }, [shouldBypass]);

  const isAsyncCompleteRef = useRef(isAsyncComplete);
  useEffect(() => {
    isAsyncCompleteRef.current = isAsyncComplete;
  }, [isAsyncComplete]);

  // Main progress and status loop
  useEffect(() => {
    if (shouldBypass) return;
    if (typeof document !== 'undefined') {
      const existingOverlay = document.getElementById('sd-minimal-terminal-overlay');
      if (existingOverlay) existingOverlay.remove();
    }

    startTimeRef.current = Date.now();
    isCompletedRef.current = false;
    let animationFrameId: number;
    let timeoutId: NodeJS.Timeout | undefined;
    let isFinished = false;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const targetMin = Math.max(minDuration, 2000);

      setElapsedSeconds((elapsed / 1000).toFixed(2));

      // Advance through statuses
      const msgCount = STATUS_MESSAGES.length;
      const currentMsgIdx = Math.min(
        msgCount - 1,
        Math.floor((elapsed / (targetMin * 0.9)) * (msgCount - 1))
      );
      setStatusIdx(currentMsgIdx);

      if (elapsed < targetMin) {
        // Progress toward ~96%
        const ratio = elapsed / targetMin;
        const currentPct = Math.min(96, Math.round(12 + (96 - 12) * Math.pow(ratio, 0.85)));
        setProgress(currentPct);
        animationFrameId = requestAnimationFrame(tick);
      } else {
        if (isAsyncCompleteRef.current) {
          if (!isFinished) {
            isFinished = true;
            isCompletedRef.current = true;
            setProgress(100);
            setStatusIdx(msgCount - 1);
            timeoutId = setTimeout(() => {
              onCompleteRef.current?.();
            }, 250);
          }
        } else {
          // Server still busy, stay at 96%
          setProgress(96);
          animationFrameId = requestAnimationFrame(tick);
        }
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (timeoutId) clearTimeout(timeoutId);

      const elapsed = Date.now() - startTimeRef.current;
      const targetMin = Math.max(minDuration, 2000);

      // If unmounted before targetMin and it is a full-page loader (!inline), preserve it until targetMin!
      if (!inline && elapsed < targetMin && !isCompletedRef.current && containerRef.current) {
        preserveMinimalLoader(containerRef.current, startTimeRef.current, targetMin, isDark);
      }
    };
  }, [minDuration, inline, isDark]);

  // Segment count for hardware track
  const activeSegments = Math.round((progress / 100) * TOTAL_SEGMENTS);

  if (shouldBypass) {
    return null;
  }

  const containerClasses = inline
    ? 'w-full py-8 flex items-center justify-center relative select-none font-mono'
    : `relative w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 select-none overflow-hidden font-mono ${
        isDark ? 'terminal-minimal-grid-dark text-[#e6e8eb]' : 'terminal-minimal-grid-light text-[#1b1c19]'
      }`;

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Corner Telemetry Markers (Rendered only on full-page mode) */}
      {!inline && (
        <>
          {isDark ? (
            <>
              {/* Dark Mode Corner Telemetry (Direct from Stitch design) */}
              <div className="absolute top-5 left-6 pointer-events-none flex items-center gap-2 text-[10px] text-[#8e95a2] uppercase tracking-widest">
                <span className="text-white font-bold">LOC:</span>
                <span>0x7FFE21A</span>
                <span className="text-[#26292e]">/</span>
                <span>SYS_INIT</span>
              </div>

              <div className="absolute top-5 right-6 pointer-events-none flex items-center gap-2 text-[10px] text-[#8e95a2] uppercase tracking-widest">
                <span>SYNC_FREQ:</span>
                <span className="text-white font-bold">120Hz</span>
                <span className="w-1.5 h-1.5 bg-white rounded-full terminal-pulse-dot" />
              </div>

              <div className="absolute bottom-5 left-6 pointer-events-none flex items-center gap-2 text-[10px] text-[#8e95a2] uppercase tracking-widest">
                <span className="text-white font-bold">[</span>
                <span>BUFFER::ALLOCATED</span>
                <span className="text-white font-bold">64.0MB</span>
                <span className="text-white font-bold">]</span>
              </div>

              <div className="absolute bottom-5 right-6 pointer-events-none flex items-center gap-2 text-[10px] text-[#8e95a2] uppercase tracking-widest">
                <span>MEM_INTEGRITY</span>
                <span className="text-white font-bold">[VERIFIED]</span>
              </div>

              {/* Center Crosshairs Subtle Backdrop Accent */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                <div className="w-96 h-[1px] bg-[#26292e]" />
                <div className="h-96 w-[1px] bg-[#26292e] absolute" />
              </div>
            </>
          ) : (
            <>
              {/* Light Mode Corner Telemetry */}
              <div className="absolute top-4 left-6 pointer-events-none opacity-40 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#45474a]">
                <span>LOC: //0x88F2</span>
                <span>•</span>
                <span>TTY: 1</span>
              </div>

              <div className="absolute top-4 right-6 pointer-events-none opacity-40 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#45474a]">
                <span>MEM: 14.2MB</span>
                <span>•</span>
                <span>LAT: 1.2MS</span>
              </div>

              <div className="absolute bottom-4 left-6 pointer-events-none opacity-35 text-[10px] uppercase tracking-widest text-[#45474a]">
                [READY_WAIT]
              </div>

              <div className="absolute bottom-4 right-6 pointer-events-none opacity-35 text-[10px] uppercase tracking-widest text-[#45474a]">
                INT_VECT: 0x09
              </div>
            </>
          )}
        </>
      )}

      {/* Dark Mode Minimal Terminal Box (Directly matching Stitch design) */}
      {isDark ? (
        <div className="relative z-10 w-full max-w-[380px] mx-auto p-5 bg-[#16191d] border-2 border-[#e6e8eb] shadow-[5px_5px_0px_0px_#000000]">
          {/* Top System Line */}
          <div className="flex items-center justify-between pb-2.5 mb-3.5 border-b border-[#26292e]">
            <div className="flex items-center gap-2">
              <span className="sd-spinner text-[13px] font-bold text-white w-3 inline-block tabular-nums">
                {SPINNER_FRAMES[spinnerIdx]}
              </span>
              <span className="text-[12px] font-bold tracking-tight text-white uppercase">
                &gt; {displayTitle}
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 border border-[#26292e] bg-[#121416] text-white font-bold">
              V2.4
            </span>
          </div>

          {/* Retro Segmented Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline text-[11px]">
              <span className="text-[#8e95a2] uppercase tracking-wider font-semibold">
                Index Cache
              </span>
              <span className="sd-progress-pct font-bold text-white tabular-nums">
                {progress}%
              </span>
            </div>

            {/* 24-Segment Hardware Block Track */}
            <div className="sd-segments w-full h-5 p-[2px] bg-[#0c0e10] border border-[#26292e] flex gap-[2px]">
              {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-full flex-1 transition-none ${
                    i < activeSegments ? 'bg-white' : 'bg-[#1e2227]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Active Process Running Line */}
          <div className="mt-3.5 pt-2.5 border-t border-[#26292e] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-[#e6e8eb] truncate min-w-0">
              <span className="text-[#75777b]">::</span>
              <span className="sd-status-msg truncate text-[#e6e8eb] lowercase">
                {STATUS_MESSAGES[statusIdx]}
              </span>
              <span className="inline-block w-2 h-3.5 bg-white terminal-cursor ml-0.5 align-middle shrink-0" />
            </div>
            <span className="sd-timer text-[#8e95a2] ml-2 text-[10px] shrink-0 tabular-nums">
              {elapsedSeconds}s
            </span>
          </div>

          {/* Minimal Bottom Micro-Label */}
          <div className="mt-3.5 flex items-center gap-2 text-[10px] text-[#75777b]">
            <span>THREAD_01: ACTIVE</span>
            <span>•</span>
            <span>NON_BLOCKING_IO</span>
          </div>
        </div>
      ) : (
        /* Light Mode Minimal Terminal Box (Directly matching Stitch design) */
        <div className="relative z-10 w-full max-w-[380px] mx-auto p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {/* Top System Line */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-black/20">
            <div className="flex items-center gap-2">
              <span className="sd-spinner text-[13px] font-bold text-[#904d00] w-3 inline-block tabular-nums">
                {SPINNER_FRAMES[spinnerIdx]}
              </span>
              <span className="text-[12px] font-bold tracking-tight text-black uppercase">
                &gt; {displayTitle}
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 bg-[#efeee9] border border-black/30 text-black font-bold">
              V2.4
            </span>
          </div>

          {/* Retro Segmented Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline text-[11px]">
              <span className="text-[#45474a] uppercase tracking-wider font-semibold">
                Index Cache
              </span>
              <span className="sd-progress-pct font-bold text-black tabular-nums">
                {progress}%
              </span>
            </div>

            {/* 24-Segment Hardware Block Track */}
            <div className="sd-segments w-full h-5 p-[2px] bg-[#f5f4ef] border border-black flex gap-[2px]">
              {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-full flex-1 transition-none ${
                    i < activeSegments ? 'bg-black' : 'bg-[#e3e3de]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Active Process Running Line */}
          <div className="mt-3 pt-2.5 border-t border-black/10 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-black truncate min-w-0">
              <span className="text-[#75777b]">::</span>
              <span className="sd-status-msg truncate text-black lowercase">
                {STATUS_MESSAGES[statusIdx]}
              </span>
              <span className="inline-block w-2 h-3.5 bg-black terminal-cursor ml-0.5 align-middle shrink-0" />
            </div>
            <span className="sd-timer text-[#75777b] ml-2 text-[10px] shrink-0 tabular-nums">
              {elapsedSeconds}s
            </span>
          </div>

          {/* Minimal Bottom Micro-Label */}
          <div className="mt-3 flex items-center gap-2 text-[10px] text-[#75777b]">
            <span>THREAD_01: ACTIVE</span>
            <span>•</span>
            <span>NON_BLOCKING_IO</span>
          </div>
        </div>
      )}
    </div>
  );
}

function preserveMinimalLoader(
  sourceEl: HTMLElement,
  startTime: number,
  targetMin: number,
  isDark: boolean
) {
  if (typeof document === 'undefined') return;
  if (document.documentElement.dataset.uiMode === 'gui') return;
  if (typeof window !== 'undefined') {
    try {
      const val = sessionStorage.getItem('sd_just_logged_in');
      if (val && Date.now() - parseInt(val, 10) < 30000) return;
    } catch {}
  }
  if (document.getElementById('sd-minimal-terminal-overlay')) return;

  const overlay = sourceEl.cloneNode(true) as HTMLElement;
  overlay.id = 'sd-minimal-terminal-overlay';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '99999';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.pointerEvents = 'none';

  document.body.appendChild(overlay);

  const pctEl = overlay.querySelector('.sd-progress-pct');
  const timerEl = overlay.querySelector('.sd-timer');
  const statusEl = overlay.querySelector('.sd-status-msg');
  const segmentsContainer = overlay.querySelector('.sd-segments');
  const spinnerEl = overlay.querySelector('.sd-spinner');

  let rafId: number;
  let spinnerFrame = 0;
  let lastSpinnerTime = Date.now();

  const tickBridge = () => {
    if (!overlay.isConnected || document.documentElement.dataset.uiMode === 'gui') {
      overlay.remove();
      return;
    }
    const elapsed = Date.now() - startTime;
    if (elapsed < targetMin) {
      const ratio = Math.min(1, elapsed / targetMin);
      const currentPct = Math.min(99, Math.round(12 + (99 - 12) * Math.pow(ratio, 0.85)));

      if (pctEl) pctEl.textContent = `${currentPct}%`;
      if (timerEl) {
        timerEl.textContent = `${(elapsed / 1000).toFixed(2)}s`;
      }

      const msgCount = STATUS_MESSAGES.length;
      const currentMsgIdx = Math.min(
        msgCount - 1,
        Math.floor((elapsed / (targetMin * 0.9)) * (msgCount - 1))
      );
      if (statusEl) statusEl.textContent = STATUS_MESSAGES[currentMsgIdx];

      if (segmentsContainer) {
        const active = Math.round((currentPct / 100) * TOTAL_SEGMENTS);
        const segments = segmentsContainer.children;
        for (let i = 0; i < segments.length; i++) {
          (segments[i] as HTMLElement).className = `h-full flex-1 transition-none ${
            i < active ? (isDark ? 'bg-white' : 'bg-black') : (isDark ? 'bg-[#1e2227]' : 'bg-[#e3e3de]')
          }`;
        }
      }

      if (spinnerEl && Date.now() - lastSpinnerTime > 120) {
        spinnerFrame = (spinnerFrame + 1) % SPINNER_FRAMES.length;
        spinnerEl.textContent = SPINNER_FRAMES[spinnerFrame];
        lastSpinnerTime = Date.now();
      }

      rafId = requestAnimationFrame(tickBridge);
    } else {
      if (pctEl) pctEl.textContent = '100%';
      if (timerEl) {
        timerEl.textContent = `${(targetMin / 1000).toFixed(2)}s`;
      }
      if (statusEl) statusEl.textContent = STATUS_MESSAGES[STATUS_MESSAGES.length - 1];
      if (segmentsContainer) {
        const segments = segmentsContainer.children;
        for (let i = 0; i < segments.length; i++) {
          (segments[i] as HTMLElement).className = `h-full flex-1 transition-none ${
            isDark ? 'bg-white' : 'bg-black'
          }`;
        }
      }

      setTimeout(() => {
        overlay.style.transition = 'opacity 250ms ease-out';
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
        }, 270);
      }, 150);
    }
  };

  rafId = requestAnimationFrame(tickBridge);
}
