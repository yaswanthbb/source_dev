'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useTheme } from '@/providers/theme-provider';
import './terminal-loaders.css';

export type PortalType = 'homepage' | 'student' | 'instructor' | 'admin';

interface LogEntry {
  time: string;
  text: string;
}

interface CenteredTerminalLoaderProps {
  portal?: PortalType;
  minDuration?: number; // minimum duration in milliseconds, default 5000
  isAsyncComplete?: boolean; // external async trigger, default true
  onComplete?: () => void;
  customTitle?: string;
}

const PORTAL_LOGS: Record<PortalType, LogEntry[]> = {
  homepage: [
    { time: '[0.001s]', text: 'Mounting local encrypted storage /dev/kip_db' },
    { time: '[0.014s]', text: 'Initializing WebAssembly DAG compiler (wasm32)' },
    { time: '[0.042s]', text: 'Rebuilding concept graph: 48 concepts, 126 edges' },
    { time: '[0.078s]', text: 'Warming SM-2 spaced repetition decay vectors...' },
    { time: '[0.145s]', text: 'Hydrating offline client cache & wire protocols' },
    { time: '[0.210s]', text: 'Resolving node [TRK-01: RAFT CONSENSUS]' },
    { time: '[0.295s]', text: 'Terminal engine online. Launching workstation canvas...' },
  ],
  student: [
    { time: '[0.001s]', text: 'Authenticating student token & decrypting secure store' },
    { time: '[0.012s]', text: 'Fetching active curriculum tracks & concept mastery graph' },
    { time: '[0.038s]', text: 'Calculating Leitner & SuperMemo SM-2 retention curves' },
    { time: '[0.075s]', text: 'Checking daily diagnostic drill budget (L3 difficulty)' },
    { time: '[0.140s]', text: 'Synchronizing peer leaderboard & streak telemetry' },
    { time: '[0.215s]', text: 'Compiling personalized active recall pipeline' },
    { time: '[0.290s]', text: 'Workspace synced. Entering student engineering hub...' },
  ],
  admin: [
    { time: '[0.001s]', text: 'Verifying root cryptographic signature & ACL token' },
    { time: '[0.011s]', text: 'Initializing role-based access control matrix (RBAC)' },
    { time: '[0.035s]', text: 'Fetching global telemetry: active nodes, users & review queues' },
    { time: '[0.072s]', text: 'Establishing secure audit log stream over TLS' },
    { time: '[0.138s]', text: 'Loading system health metrics & database WAL checkpoints' },
    { time: '[0.210s]', text: 'Initializing admin command dispatch daemon' },
    { time: '[0.285s]', text: 'Root privileges confirmed. Granting administrative console...' },
  ],
  instructor: [
    { time: '[0.001s]', text: 'Validating instructor credentials & course authorship keys' },
    { time: '[0.015s]', text: 'Loading modular roadmap schemas & markdown AST parser' },
    { time: '[0.040s]', text: 'Fetching concept submission queue & student Q&A threads' },
    { time: '[0.078s]', text: 'Compiling code sandbox runtime & validation test suite' },
    { time: '[0.145s]', text: 'Synchronizing syllabus version history with upstream git' },
    { time: '[0.220s]', text: 'Hydrating grading rubrics & diagnostic drill telemetry' },
    { time: '[0.295s]', text: 'Content editor ready. Launching instructor console...' },
  ],
};

const PORTAL_HEADERS: Record<PortalType, string> = {
  homepage: 'COMPILING RECALL GRAPH & WASM RUNTIME',
  student: 'INITIALIZING ACTIVE RECALL WORKSPACE',
  admin: 'INITIALIZING ROOT SECURITY & ACCESS ENCLAVE',
  instructor: 'COMPILING CURRICULUM SCHEMAS & AST RUNTIME',
};

const PORTAL_TELEMETRY: Record<PortalType, { label1: string; val1: string; label2: string; val2: string; label3: string; val3: string }> = {
  homepage: {
    label1: 'Storage Engine',
    val1: 'OPFS / SQLite',
    label2: 'DAG Hydration',
    val2: '38 / 48 Nodes',
    label3: 'Sync Latency',
    val3: '~140ms (p99)',
  },
  student: {
    label1: 'Active Memory',
    val1: 'SM-2 Vector Engine',
    label2: 'Progress Sync',
    val2: '100% Decrypted',
    label3: 'Stream Latency',
    val3: '0.8ms (Cached)',
  },
  admin: {
    label1: 'Privilege Level',
    val1: 'UID 0 / ROOT',
    label2: 'Audit Log Stream',
    val2: 'TLS 1.3 / mTLS',
    label3: 'Buffer Status',
    val3: 'WAL Flush OK',
  },
  instructor: {
    label1: 'Schema Parser',
    val1: 'WASM Markdown AST',
    label2: 'Course Branches',
    val2: 'Upstream Git Synced',
    label3: 'Compiler Sandbox',
    val3: 'Isolated Ring-3',
  },
};

export function CenteredTerminalLoader({
  portal = 'homepage',
  minDuration = 5000,
  isAsyncComplete = true,
  onComplete,
  customTitle,
}: CenteredTerminalLoaderProps) {
  const { isDark } = useTheme();
  const [visibleLogCount, setVisibleLogCount] = useState(1);
  const [isDone, setIsDone] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const percentTextRef = useRef<HTMLSpanElement>(null);
  const bufferTextRef = useRef<HTMLSpanElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isCompletedRef = useRef(false);
  const startTimeRef = useRef<number>(Date.now());
  const logs = useMemo(() => PORTAL_LOGS[portal] || PORTAL_LOGS.homepage, [portal]);
  const headerTitle = customTitle || PORTAL_HEADERS[portal] || PORTAL_HEADERS.homepage;
  const telemetry = PORTAL_TELEMETRY[portal] || PORTAL_TELEMETRY.homepage;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const isAsyncCompleteRef = useRef(isAsyncComplete);
  useEffect(() => {
    isAsyncCompleteRef.current = isAsyncComplete;
  }, [isAsyncComplete]);

  // Auto-scroll live stdout container to keep latest terminal line in view
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [visibleLogCount]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const existing = document.getElementById('kip-centered-terminal-overlay');
      if (existing) existing.remove();
    }
    startTimeRef.current = Date.now();
    isCompletedRef.current = false;
    const totalLogs = logs.length;
    let animationFrameId: number;
    let timeoutId: NodeJS.Timeout | undefined;
    let isCompleted = false;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const targetMin = Math.max(minDuration, 5000);

      // Distribute log entries sequentially across the first 82% of minDuration
      const logInterval = (targetMin * 0.82) / totalLogs;
      const currentLogStep = Math.min(totalLogs, Math.floor(elapsed / logInterval) + 1);
      setVisibleLogCount((prev) => (prev !== currentLogStep ? currentLogStep : prev));

      if (elapsed < targetMin) {
        // Continuous, smooth 60fps progression from 0% to ~98.5% over targetMin
        const ratio = Math.min(1, elapsed / targetMin);
        const currentPct = Math.min(99.0, 100 * Math.pow(ratio, 0.92));
        const formattedPct = currentPct.toFixed(1);

        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${formattedPct}%`;
        }
        if (percentTextRef.current) {
          percentTextRef.current.textContent = `${formattedPct}%`;
        }
        if (bufferTextRef.current) {
          const kb = ((currentPct / 100) * 128).toFixed(1);
          bufferTextRef.current.textContent = `BUFFER: ${kb}KB / 128KB`;
        }

        animationFrameId = requestAnimationFrame(tick);
      } else {
        // minDuration elapsed; check if external async operation has finished
        if (isAsyncCompleteRef.current) {
          if (!isCompleted) {
            isCompleted = true;
            isCompletedRef.current = true;
            setIsDone(true);
            if (progressBarRef.current) {
              progressBarRef.current.style.width = '100%';
            }
            if (percentTextRef.current) {
              percentTextRef.current.textContent = '100.0%';
            }
            if (bufferTextRef.current) {
              bufferTextRef.current.textContent = 'BUFFER: 128.0KB / 128KB';
            }
            setVisibleLogCount(totalLogs);
            // Brief pause at 100% to let the user see the completed terminal state
            timeoutId = setTimeout(() => {
              onCompleteRef.current?.();
            }, 350);
          }
        } else {
          // Keep holding gracefully between 96.8% and 98.4% with subtle micro pulse
          const holdPct = 96.8 + Math.sin(elapsed / 400) * 1.2;
          const formattedHold = holdPct.toFixed(1);
          if (progressBarRef.current) {
            progressBarRef.current.style.width = `${formattedHold}%`;
          }
          if (percentTextRef.current) {
            percentTextRef.current.textContent = `${formattedHold}%`;
          }
          animationFrameId = requestAnimationFrame(tick);
        }
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (timeoutId) clearTimeout(timeoutId);

      const elapsed = Date.now() - startTimeRef.current;
      const targetMin = Math.max(minDuration, 5000);
      if (elapsed < targetMin && !isCompletedRef.current && containerRef.current) {
        preserveCenteredLoader(containerRef.current, startTimeRef.current, targetMin, isDark);
      }
    };
  }, [minDuration, logs.length, isDark]);

  return (
    <div
      ref={containerRef}
      className={`min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden select-none font-mono ${
        isDark ? 'terminal-loader-grid-dark text-[#e6e8eb]' : 'terminal-loader-grid-light text-[#111418]'
      }`}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Ambient corner system metadata */}
      <div
        className={`fixed top-4 left-6 text-[10px] tracking-widest uppercase pointer-events-none select-none ${
          isDark ? 'text-[#525866]' : 'text-[#8a8d94]'
        }`}
      >
        SYS_ID: KIP_DAEMON_0x9A // STANDBY
      </div>

      <div
        className={`fixed top-4 right-6 text-[10px] tracking-widest uppercase pointer-events-none select-none flex items-center gap-2 ${
          isDark ? 'text-[#525866]' : 'text-[#8a8d94]'
        }`}
      >
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full terminal-pulse-dot ${
            isDark ? 'bg-emerald-400' : 'bg-emerald-600'
          }`}
        />
        CORE_V3.4 [WASM-ISOLATE]
      </div>

      <div
        className={`fixed bottom-4 left-6 text-[10px] tracking-widest uppercase pointer-events-none select-none ${
          isDark ? 'text-[#404550]' : 'text-[#a1a4ac]'
        }`}
      >
        SECURITY: ZERO-KNOWLEDGE ENCLAVE
      </div>

      <div
        className={`fixed bottom-4 right-6 text-[10px] tracking-widest uppercase pointer-events-none select-none ${
          isDark ? 'text-[#404550]' : 'text-[#a1a4ac]'
        }`}
      >
        SECURE BOOT BUFFER
      </div>

      {/* Focused Center Terminal Window Modal */}
      <main
        className={`w-full max-w-[620px] relative z-10 transition-all ${
          isDark
            ? 'bg-[#121417] border border-[#2b3038] shadow-[0_20px_50px_rgba(0,0,0,0.85)]'
            : 'bg-[#ffffff] border-2 border-[#111418] shadow-[6px_6px_0px_#111418]'
        }`}
      >
        {/* Terminal Titlebar */}
        <header
          className={`flex items-center justify-between px-3 py-2 text-[11px] select-none ${
            isDark
              ? 'bg-[#181b20] border-b border-[#2b3038] text-[#8e96a4]'
              : 'bg-[#111418] text-white border-b-2 border-[#111418]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`font-bold tracking-tight ${isDark ? 'text-white' : 'text-white'}`}>
              KIP // SYS_BOOT
            </span>
            <span className={isDark ? 'text-[#525866]' : 'text-[#a0a5af]'}>
              [PID: 0x4A1F]
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-[10px] px-1.5 py-0.5 border ${
                isDark
                  ? 'bg-[#222730] text-[#a0a8b7] border-[#2e3540]'
                  : 'bg-[#222730] text-[#e0e3eb] border-[#3b4352]'
              }`}
            >
              [STREAM: TTY0]
            </span>
          </div>
        </header>

        {/* Main Loader Body */}
        <div className="p-5 space-y-4">
          {/* Primary Status & Percentage Banner */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span
                className={`font-semibold tracking-wider flex items-center gap-2 uppercase ${
                  isDark ? 'text-[#f1f3f5]' : 'text-[#111418] font-bold'
                }`}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-none terminal-pulse-dot ${
                    isDark ? 'bg-white' : 'bg-[#111418]'
                  }`}
                />
                {headerTitle}
              </span>
              <span
                ref={percentTextRef}
                className={`kip-centered-pct font-bold tabular-nums ${
                  isDark ? 'text-white' : 'text-[#111418]'
                }`}
              >
                0.0%
              </span>
            </div>

            {/* ASCII / Segmented Progress Bar with Diagonal Stripes */}
            <div
              className={`w-full p-1 ${
                isDark
                  ? 'bg-[#0a0c0e] border border-[#2b3038]'
                  : 'bg-[#edece6] border-2 border-[#111418] p-0.5'
              }`}
            >
              <div
                ref={progressBarRef}
                className={`kip-centered-bar h-4 relative overflow-hidden ${
                  isDark ? 'bg-white/90' : 'bg-[#111418]'
                }`}
                style={{ width: '0%', transition: 'none' }}
              >
                {/* Diagonal stripes pattern on bar */}
                <div
                  className={`absolute inset-0 opacity-25 ${
                    isDark ? 'terminal-progress-stripes-dark' : 'terminal-progress-stripes-light'
                  }`}
                />
              </div>
            </div>

            <div
              className={`flex items-center justify-between text-[10px] pt-0.5 ${
                isDark ? 'text-[#717886]' : 'text-[#555a64] font-medium'
              }`}
            >
              <span className="uppercase">
                TASK: LINKING DAG PREREQUISITE EDGES...
              </span>
              <span ref={bufferTextRef} className="kip-centered-buffer tabular-nums">
                BUFFER: 0.0KB / 128KB
              </span>
            </div>
          </div>

          {/* Live Terminal stdout Log Box */}
          <div
            ref={logContainerRef}
            className={`p-3 text-[11px] font-mono leading-relaxed space-y-1 max-h-[160px] min-h-[140px] overflow-y-auto ${
              isDark
                ? 'bg-[#090b0d] border border-[#242932] text-[#8b93a0]'
                : 'bg-[#f5f4ee] border border-[#cfceca] text-[#22262d]'
            }`}
          >
            <div
              className={`text-[10px] pb-1 mb-1.5 flex justify-between border-b ${
                isDark ? 'text-[#555d6c] border-[#1c2128]' : 'text-[#7c828d] border-[#e1dfd8]'
              }`}
            >
              <span>-- /dev/pts/0 (ipc-daemon-sync) --</span>
              <span className={isDark ? 'text-emerald-500/80 font-semibold' : 'text-emerald-700 font-bold'}>
                LIVE_STDOUT
              </span>
            </div>

            {/* Dynamic Sequential Output Lines */}
            {logs.slice(0, visibleLogCount).map((entry, idx) => {
              const isLatest = idx === visibleLogCount - 1 && !isDone;
              return (
                <p key={idx} className="flex justify-between items-center text-[11px]">
                  <span className="truncate pr-2 flex items-center">
                    <span className={`mr-1.5 ${isDark ? 'text-[#4b5360]' : 'text-[#808692]'}`}>
                      {entry.time}
                    </span>
                    <span className={isDark ? (isLatest ? 'text-white font-medium' : 'text-[#c4cbd4]') : 'text-[#111418]'}>
                      {entry.text}
                    </span>
                    {isLatest && (
                      <span
                        className={`inline-block w-2 h-3.5 ml-1 terminal-cursor shrink-0 ${
                          isDark ? 'bg-white' : 'bg-[#111418]'
                        }`}
                      />
                    )}
                  </span>
                  {!isLatest ? (
                    <span
                      className={`font-semibold shrink-0 ${
                        isDark ? 'text-white' : 'text-[#111418] font-bold'
                      }`}
                    >
                      [OK]
                    </span>
                  ) : (
                    <span
                      className={`font-semibold shrink-0 text-[10px] ${
                        isDark ? 'text-emerald-400' : 'text-emerald-700 font-bold'
                      }`}
                    >
                      [ACTIVE]
                    </span>
                  )}
                </p>
              );
            })}
          </div>

          {/* Compact Telemetry / Hardware Indicators Grid */}
          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pt-1">
            <div
              className={`p-2 border ${
                isDark
                  ? 'bg-[#16191f] border-[#262c36]'
                  : 'bg-[#faf9f5] border border-[#cfceca]'
              }`}
            >
              <span
                className={`block text-[9px] uppercase tracking-wider ${
                  isDark ? 'text-[#636c7c]' : 'text-[#6e737e] font-semibold'
                }`}
              >
                {telemetry.label1}
              </span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[#111418]'}`}>
                {telemetry.val1}
              </span>
            </div>

            <div
              className={`p-2 border ${
                isDark
                  ? 'bg-[#16191f] border-[#262c36]'
                  : 'bg-[#faf9f5] border border-[#cfceca]'
              }`}
            >
              <span
                className={`block text-[9px] uppercase tracking-wider ${
                  isDark ? 'text-[#636c7c]' : 'text-[#6e737e] font-semibold'
                }`}
              >
                {telemetry.label2}
              </span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[#111418]'}`}>
                {telemetry.val2}
              </span>
            </div>

            <div
              className={`p-2 border ${
                isDark
                  ? 'bg-[#16191f] border-[#262c36]'
                  : 'bg-[#faf9f5] border border-[#cfceca]'
              }`}
            >
              <span
                className={`block text-[9px] uppercase tracking-wider ${
                  isDark ? 'text-[#636c7c]' : 'text-[#6e737e] font-semibold'
                }`}
              >
                {telemetry.label3}
              </span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[#111418]'}`}>
                {telemetry.val3}
              </span>
            </div>
          </div>

          {/* Action / Interrupt Footer */}
          <div
            className={`flex items-center justify-between pt-2 border-t text-[10px] font-mono ${
              isDark ? 'border-[#232730] text-[#616a78]' : 'border-[#dedcd5] text-[#636873]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={isDark ? 'text-emerald-500/80 font-bold' : 'text-[#111418] font-bold'}>
                &gt;
              </span>
              <span className={isDark ? 'text-[#8b93a0]' : 'text-[#22262d]'}>
                daemon.sh running
              </span>
              <span className={isDark ? 'text-[#525866]' : 'text-[#7c828d]'}>
                --pid 0x4a1f --watch-dag
              </span>
              <span
                className={`inline-block w-1.5 h-3 ml-0.5 terminal-cursor ${
                  isDark ? 'bg-white/70' : 'bg-[#111418]'
                }`}
              />
            </div>
            <div
              className={`tabular-nums tracking-wider uppercase text-[9px] ${
                isDark ? 'text-[#525866]' : 'text-[#8a8d94]'
              }`}
            >
              {isDark ? 'STATUS: ACTIVE_LOOP' : 'BACKGROUND PROCESS ACTIVE'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function preserveCenteredLoader(
  sourceEl: HTMLElement,
  startTime: number,
  targetMin: number,
  isDark: boolean
) {
  if (typeof document === 'undefined') return;
  if (document.getElementById('kip-centered-terminal-overlay')) return;

  const overlay = sourceEl.cloneNode(true) as HTMLElement;
  overlay.id = 'kip-centered-terminal-overlay';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '99999';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.pointerEvents = 'none';

  document.body.appendChild(overlay);

  const pctEl = overlay.querySelector('.kip-centered-pct');
  const barEl = overlay.querySelector('.kip-centered-bar') as HTMLElement | null;
  const bufferEl = overlay.querySelector('.kip-centered-buffer');

  let rafId: number;

  const tickBridge = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed < targetMin) {
      const ratio = Math.min(1, elapsed / targetMin);
      const currentPct = Math.min(99.0, 100 * Math.pow(ratio, 0.92));
      const formattedPct = currentPct.toFixed(1);

      if (barEl) barEl.style.width = `${formattedPct}%`;
      if (pctEl) pctEl.textContent = `${formattedPct}%`;
      if (bufferEl) {
        const kb = ((currentPct / 100) * 128).toFixed(1);
        bufferEl.textContent = `BUFFER: ${kb}KB / 128KB`;
      }

      rafId = requestAnimationFrame(tickBridge);
    } else {
      if (barEl) barEl.style.width = '100%';
      if (pctEl) pctEl.textContent = '100.0%';
      if (bufferEl) bufferEl.textContent = 'BUFFER: 128.0KB / 128KB';

      setTimeout(() => {
        overlay.style.transition = 'opacity 250ms ease-out';
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
        }, 270);
      }, 350);
    }
  };

  rafId = requestAnimationFrame(tickBridge);
}
