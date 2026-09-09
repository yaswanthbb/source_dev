'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/providers/theme-provider';
import { getToken } from '@/lib/auth';
import './retro-terminal.css';

export function RetroHomepage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Floating Window: Interval Selector State
  const [selectedInterval, setSelectedInterval] = useState<'1D' | '3D' | '7D' | '30D'>('1D');

  // Markdown Spec: Copy State
  const [copied, setCopied] = useState<boolean>(false);

  // Diagnostic Drill State
  const [drillOption, setDrillOption] = useState<'A' | 'B' | 'C'>('B');
  const [streak, setStreak] = useState<number>(14);
  const [showExplanation, setShowExplanation] = useState<boolean>(true);

  useEffect(() => {
    const token = getToken();
    setIsAuthenticated(!!token);
  }, []);

  // Copy Protocol Spec to Clipboard
  const handleCopySpec = () => {
    const specText = `## Paxos vs Raft (Consensus Invariant)
• Leader Election: Randomized timers [150-300ms]
• Log Matching: If 2 logs contain same index & term...
• Safety Rule: Overwrite uncommitted candidate logs`;

    navigator.clipboard.writeText(specText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }).catch(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  // Scroll to diagnostic drill
  const handleScrollToDrill = () => {
    const drillElement = document.getElementById('diagnostic-drill');
    if (drillElement) {
      drillElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Next drill handler
  const handleNextDrill = () => {
    if (drillOption === 'B') {
      setStreak((s) => s + 1);
    }
    setDrillOption('B');
  };

  return (
    <div className={`retro-terminal-root ${isDark ? 'dark' : ''}`}>
      {/* Background Retro Grid Matrix */}
      <div className={`retro-grid-bg min-h-screen flex flex-col w-full ${
        isDark
          ? 'selection:bg-[#e6e8eb] selection:text-[#111417]'
          : 'selection:bg-black selection:text-white'
      }`}>
        
        {/* ====================================================================
            HEADER / PERSISTENT TERMINAL NAV (Matching Updated Stitch Design)
            ==================================================================== */}
        <header className={`fixed top-0 left-0 right-0 z-50 h-14 w-full px-gutter-sm md:px-gutter-lg flex items-center justify-between border-b backdrop-blur-sm transition-colors duration-200 ${
          isDark
            ? 'bg-[#111417]/95 border-[#383e47]'
            : 'bg-[#faf9f4]/95 border-black/20'
        }`}>
          {/* Brand & Left System Telemetry */}
          <div className="flex items-center gap-unit-4">
            <Link href="/" className="flex items-center gap-unit-2 group">
              <span className={`w-2.5 h-2.5 inline-block ${isDark ? 'bg-[#e6e8eb]' : 'bg-black'}`} />
              <span className={`font-code-md text-code-md font-bold tracking-tight uppercase ${
                isDark ? 'text-[#e6e8eb]' : 'text-black'
              }`}>
                KIP // KNOWLEDGE IS POWER
              </span>
            </Link>

            {/* System Status Pill */}
            <span
              className={`font-label-sm text-label-sm px-unit-2 py-unit-1 border uppercase font-mono ${
                isDark
                  ? 'border-[#383e47] bg-[#181b1f] text-[#56d364]'
                  : 'border-black/40 bg-[#f5f4ef] text-black'
              }`}
            >
              [SYS: OK]
            </span>
          </div>

          {/* Right: Mode Toggle Button & Root Badge (Clean Minimalist matching updated Stitch) */}
          <div className="flex items-center gap-unit-4">
            {/* Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle light/dark mode"
              title={`Toggle Mode: currently ${isDark ? 'Dark' : 'Light'}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold tracking-wider cursor-pointer select-none transition-none ${
                isDark
                  ? 'text-[#e6e8eb] bg-[#14171b] border border-[#383e47] hover:border-[#e6e8eb] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.6)]'
                  : 'text-black bg-white border border-black hover:bg-[#e9e8e3] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <span
                className={`w-2 h-2 inline-block ${
                  isDark ? 'bg-[#56d364]' : 'bg-black'
                }`}
              />
              <span>{isDark ? '[MODE: DK]' : '[MODE: LT]'}</span>
            </button>

            {/* Root / Session Badge */}
            <Link
              href={isAuthenticated ? '/student/dashboard' : '/login'}
              className={`inline-flex font-label-sm text-label-sm px-unit-3 py-unit-1 border uppercase font-mono ${
                isDark
                  ? 'border-[#383e47] bg-[#14171b] text-[#e6e8eb]'
                  : 'border-[#c5c6cb] bg-[#f5f4ef] text-black'
              }`}
            >
              [P1: ROOT]
            </Link>
          </div>
        </header>

        {/* ====================================================================
            MAIN CONTENT WRAPPER
            ==================================================================== */}
        <main className="w-full pt-14 flex-1">
          <div className="flex flex-col w-full">

            {/* ----------------------------------------------------------------
                HERO SECTION // ARCHITECTURAL INTRO
                ---------------------------------------------------------------- */}
            <section className={`relative w-full px-gutter-sm md:px-gutter-lg py-unit-8 flex flex-col items-center border-b overflow-hidden ${
              isDark ? 'border-[#2a2e34]' : 'border-black/20'
            }`}>
              {/* Halftone Dot Matrix Margins */}
              <div
                className="absolute left-2 top-8 w-28 h-64 pointer-events-none hidden lg:block retro-halftone-pattern"
                aria-hidden="true"
              />
              <div
                className="absolute right-2 top-8 w-28 h-64 pointer-events-none hidden lg:block retro-halftone-pattern"
                aria-hidden="true"
              />

              {/* Micro Metadata Tracker */}
              <div className="flex items-center gap-unit-3 mb-unit-5">
                <span
                  className={`font-label-sm text-label-sm px-unit-2 py-unit-1 border uppercase font-mono ${
                    isDark
                      ? 'border-[#383e47] bg-[#181b1f] text-[#e6e8eb] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]'
                      : 'border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  SPEC_VER: 3.4.1 // ZERO-BLOAT
                </span>
                <span className={`font-label-sm text-label-sm flex items-center gap-unit-1 font-mono ${
                  isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
                }`}>
                  <span
                    className={`w-1.5 h-1.5 inline-block ${
                      isDark ? 'bg-[#56d364]' : 'bg-[#fe932c]'
                    }`}
                  />
                  <span>LATENCY: 0.8ms (OFFLINE CACHED)</span>
                </span>
              </div>

              {/* Main Headline with Retro Block Cursor */}
              <div className="max-w-4xl text-center flex flex-col items-center">
                <h1 className={`font-display-lg text-display-lg uppercase tracking-tight font-bold inline-block ${
                  isDark ? 'text-[#e6e8eb]' : 'text-black'
                }`}>
                  STRUCTURED KNOWLEDGE<br className="hidden sm:inline" /> FOR ENGINEERS.
                  <span aria-hidden="true" className="retro-terminal-cursor" />
                </h1>
                <p className={`font-code-md text-code-md mt-unit-4 max-w-2xl leading-relaxed ${
                  isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
                }`}>
                  Connected roadmaps, markdown concepts, and spaced repetition. No video bloat. Just distilled state machines and active diagnostic drills.
                </p>

                {/* Action Button Triad */}
                <div className="flex flex-wrap items-center justify-center gap-unit-3 mt-unit-6">
                  <Link
                    href={isAuthenticated ? '/student/dashboard' : '/login'}
                    className={`font-label-md text-label-md retro-hero-btn px-unit-5 py-unit-3 uppercase font-bold border transition-none active:translate-x-[2px] active:translate-y-[2px] ${
                      isDark
                        ? 'bg-[#e6e8eb] text-[#111417] border-[#e6e8eb] hover:bg-transparent hover:text-[#e6e8eb] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)]'
                        : 'bg-black text-white border-black hover:bg-white hover:text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    {isDark ? '[START LEARNING]' : '[START LEARNING →]'}
                  </Link>

                  <a
                    href="#tracks"
                    className={`font-label-md text-label-md retro-hero-btn px-unit-5 py-unit-3 uppercase font-bold border transition-none ${
                      isDark
                        ? 'bg-transparent text-[#e6e8eb] border-[#484f5a] hover:border-[#e6e8eb] hover:bg-[#181b1f] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)]'
                        : 'bg-white text-black border-black hover:bg-[#e9e8e3] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    [BROWSE TRACKS]
                  </a>

                  <button
                    type="button"
                    onClick={handleScrollToDrill}
                    id="quick-drill-btn"
                    className={`font-label-md text-label-md retro-hero-btn px-unit-4 py-unit-3 uppercase font-bold border flex items-center gap-unit-1 cursor-pointer transition-none ${
                      isDark
                        ? 'bg-[#181b1f] text-[#e6e8eb] border-[#484f5a] hover:border-[#e6e8eb] hover:bg-[#22262c] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)]'
                        : 'bg-[#ffdcc3] text-[#2f1500] border-black hover:bg-[#fe932c] hover:text-[#2f1500] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    {/* SVG Lightning Bolt Icon (Rock Solid Vector) */}
                    <svg className="w-4 h-4 inline-block" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    <span>[QUICK DRILL // 2 MIN]</span>
                  </button>
                </div>
              </div>

              {/* CENTERPIECE RETRO WORKSTATION WINDOW */}
              <div className="w-full max-w-5xl mt-unit-8 relative">
                {/* Main Window Frame */}
                <div
                  className={`w-full border-2 ${
                    isDark
                      ? 'bg-[#181b1f] border-[#383e47] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.9)]'
                      : 'bg-white border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  {/* Titlebar with Classic Retro Pinstripes */}
                  <div
                    className={`h-8 border-b-2 flex items-center justify-between px-unit-3 relative overflow-hidden retro-pinstripe-titlebar ${
                      isDark
                        ? 'border-[#383e47] bg-[#22262c]'
                        : 'border-black bg-[#efeee9]'
                    }`}
                  >
                    {/* Left Window Control Box */}
                    <div
                      className={`relative z-10 flex items-center gap-unit-1 px-unit-2 border ${
                        isDark
                          ? 'bg-[#22262c] border-[#383e47]'
                          : 'bg-[#efeee9] border-black'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 border inline-flex items-center justify-center text-[9px] font-mono leading-none ${
                          isDark
                            ? 'border-[#484f5a] bg-[#181b1f] text-[#8b939e]'
                            : 'border-black bg-white text-black'
                        }`}
                      >
                        ■
                      </span>
                      <span
                        className={`w-2.5 h-2.5 border inline-flex items-center justify-center text-[9px] font-mono leading-none ${
                          isDark
                            ? 'border-[#484f5a] bg-[#181b1f] text-[#8b939e]'
                            : 'border-black bg-white text-black'
                        }`}
                      >
                        ▤
                      </span>
                    </div>

                    {/* Centered Window Title Badge */}
                    <div
                      className={`relative z-10 px-unit-3 py-0.5 border font-label-sm text-label-sm uppercase font-bold tracking-wider ${
                        isDark
                          ? 'bg-[#181b1f] border-[#383e47] text-[#cbd0d6]'
                          : 'bg-white border-black text-black'
                      }`}
                    >
                      GRAPH_VIEW.SYS • ENGINEERING_CORE [RENDER_PASS: 01]
                    </div>

                    {/* Right Window Widgets */}
                    <div
                      className={`relative z-10 flex items-center gap-unit-1 px-unit-2 border ${
                        isDark
                          ? 'bg-[#22262c] border-[#383e47]'
                          : 'bg-[#efeee9] border-black'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 border inline-flex items-center justify-center text-[9px] font-mono leading-none cursor-pointer ${
                          isDark
                            ? 'border-[#484f5a] bg-[#181b1f] text-[#8b939e]'
                            : 'border-black bg-white text-black hover:bg-[#ba1a1a] hover:text-white'
                        }`}
                      >
                        _
                      </span>
                      <span
                        className={`w-2.5 h-2.5 border inline-flex items-center justify-center text-[9px] font-mono leading-none cursor-pointer ${
                          isDark
                            ? 'border-[#484f5a] bg-[#181b1f] text-[#8b939e]'
                            : 'border-black bg-white text-black hover:bg-[#ba1a1a] hover:text-white'
                        }`}
                      >
                        +
                      </span>
                      <span
                        className={`w-2.5 h-2.5 border inline-flex items-center justify-center text-[9px] font-mono leading-none cursor-pointer ${
                          isDark
                            ? 'border-[#484f5a] bg-[#181b1f] text-[#8b939e] hover:bg-[#ff6b6b] hover:text-[#111417]'
                            : 'border-black bg-white text-black hover:bg-[#ba1a1a] hover:text-white'
                        }`}
                      >
                        ✕
                      </span>
                    </div>
                  </div>

                  {/* Window Canvas: DAG Directed Graph View */}
                  <div
                    className={`p-unit-6 md:p-unit-8 min-h-[340px] flex flex-col justify-between relative overflow-x-auto ${
                      isDark ? 'bg-[#111417]' : 'bg-[#f5f4ef]'
                    }`}
                  >
                    {/* Dot Grid Background Inside Canvas */}
                    <div
                      className="absolute inset-0 pointer-events-none retro-canvas-pattern"
                      aria-hidden="true"
                    />

                    {/* Canvas Top Diagnostic Line */}
                    <div
                      className={`relative z-10 flex items-center justify-between border-b pb-unit-3 font-code-md text-[11px] ${
                        isDark
                          ? 'border-[#2a2e34] text-[#8b939e]'
                          : 'border-black/20 text-[#45474a]'
                      }`}
                    >
                      <span className="uppercase">
                        VIEWPORT: 1024x480 • COORD_SYS: CARTESIAN • DAG_RENDERER: WASM
                      </span>
                      <span
                        className={`font-label-sm px-unit-2 border ${
                          isDark
                            ? 'bg-[#1e2227] border-[#383e47] text-[#cbd0d6]'
                            : 'bg-[#e9e8e3] border-black/30 text-black'
                        }`}
                      >
                        ZOOM: 100% [FIXED]
                      </span>
                    </div>

                    {/* Graph Pipeline Nodes */}
                    <div className="relative z-10 py-unit-8 flex flex-col md:flex-row items-center justify-center gap-unit-4 md:gap-unit-2 my-auto">
                      {/* Node 1: Data Structures */}
                      <div className="flex flex-col items-center group cursor-pointer">
                        <div
                          className={`px-unit-4 py-unit-3 text-center min-w-[170px] transition-none border-2 ${
                            isDark
                              ? 'bg-[#181b1f] border-[#484f5a] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] hover:border-[#e6e8eb]'
                              : 'bg-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#e9e8e3]'
                          }`}
                        >
                          <div className={`font-code-md text-code-md font-bold ${
                            isDark ? 'text-[#e6e8eb]' : 'text-black'
                          }`}>
                            [Data Structures]
                          </div>
                          <div
                            className={`font-label-sm text-[10px] mt-1 uppercase flex items-center justify-center gap-1 font-mono ${
                              isDark ? 'text-[#8b939e]' : 'text-black/80'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 inline-block ${
                                isDark ? 'bg-[#56d364]' : 'bg-black'
                              }`}
                            />
                            <span>[PASS // 100%]</span>
                          </div>
                        </div>
                        <span className={`font-label-sm text-[9px] mt-1.5 font-mono ${
                          isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
                        }`}>
                          NODE_01 • 32 CARDS
                        </span>
                      </div>

                      {/* Arrow 1 */}
                      <div className={`flex items-center px-unit-2 font-code-md text-base select-none ${
                        isDark ? 'text-[#8b939e]' : 'text-black'
                      }`}>
                        <span className="hidden md:inline font-bold">────────►</span>
                        <span className="inline md:hidden font-bold">▼</span>
                      </div>

                      {/* Node 2: Concurrency (Active Focus) */}
                      <div className="flex flex-col items-center group cursor-pointer scale-105">
                        <div
                          className={`px-unit-5 py-2.5 text-center min-w-[190px] border-2 ${
                            isDark
                              ? 'bg-[#1f242b] border-[#e6e8eb] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)]'
                              : 'bg-black border-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]'
                          }`}
                        >
                          <div className={`font-code-md text-code-md font-bold tracking-wide ${
                            isDark ? 'text-[#e6e8eb]' : 'text-white'
                          }`}>
                            [Concurrency]
                          </div>
                          <div
                            className={`font-label-sm text-[10px] mt-1 uppercase flex items-center justify-center gap-1 font-mono ${
                              isDark ? 'text-[#cbd0d6]' : 'text-[#ffdcc3]'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 inline-block animate-ping ${
                                isDark ? 'bg-[#e6e8eb]' : 'bg-[#fe932c]'
                              }`}
                            />
                            <span>[ACTIVE // NODE_02]</span>
                          </div>
                        </div>
                        <span
                          className={`font-label-sm text-[9px] mt-1.5 font-bold font-mono uppercase px-1.5 border ${
                            isDark
                              ? 'bg-[#e6e8eb] text-[#111417] border-[#e6e8eb]'
                              : 'bg-[#ffdcc3] text-black border-black'
                          }`}
                        >
                          CURRENT FOCUS
                        </span>
                      </div>

                      {/* Arrow 2 */}
                      <div className={`flex items-center px-unit-2 font-code-md text-base select-none ${
                        isDark ? 'text-[#8b939e]' : 'text-black'
                      }`}>
                        <span className="hidden md:inline font-bold">────────►</span>
                        <span className="inline md:hidden font-bold">▼</span>
                      </div>

                      {/* Node 3: Raft Consensus */}
                      <div className="flex flex-col items-center group cursor-pointer">
                        <div
                          className={`px-unit-4 py-unit-3 text-center min-w-[170px] border-2 border-dashed ${
                            isDark
                              ? 'bg-[#181b1f] border-[#484f5a] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] hover:border-[#e6e8eb]'
                              : 'bg-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#e9e8e3]'
                          }`}
                        >
                          <div className={`font-code-md text-code-md font-bold ${
                            isDark ? 'text-[#e6e8eb]' : 'text-black'
                          }`}>
                            [Raft Consensus]
                          </div>
                          <div className={`font-label-sm text-[10px] mt-1 uppercase flex items-center justify-center gap-1 font-mono ${
                            isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
                          }`}>
                            <span>[BOSS_STAGE // 64% HP]</span>
                          </div>
                        </div>
                        <span className={`font-label-sm text-[9px] mt-1.5 font-mono ${
                          isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
                        }`}>
                          NODE_03 • 18 DRILLS
                        </span>
                      </div>
                    </div>

                    {/* Bottom Status Strip */}
                    <div
                      className={`relative z-10 border-t-2 pt-unit-2 mt-unit-4 flex flex-wrap items-center justify-between font-label-sm text-label-sm uppercase font-mono ${
                        isDark
                          ? 'border-[#2a2e34] text-[#8b939e]'
                          : 'border-black text-black'
                      }`}
                    >
                      <div className="flex items-center gap-unit-4">
                        <span className={isDark ? 'text-[#cbd0d6]' : 'text-black'}>
                          ● STATUS: NODES: 48 // ACTIVE SESSION
                        </span>
                        <span className="hidden sm:inline">
                          | MEMORY: 128KB // WASM ENGINE OK
                        </span>
                      </div>
                      <div className="flex items-center gap-unit-2">
                        <span
                          className={`px-unit-2 py-0.5 border ${
                            isDark
                              ? 'bg-[#181b1f] border-[#383e47] text-[#cbd0d6]'
                              : 'bg-[#efeee9] border-black text-black'
                          }`}
                        >
                          [DAG_CYCLE: DETECTED_0]
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OVERLAPPING SECONDARY FLOATING WINDOW: Review Interval Tags */}
                <div
                  className={`md:absolute -bottom-8 right-4 md:right-8 w-full md:w-80 border-2 mt-unit-4 md:mt-0 z-20 ${
                    isDark
                      ? 'bg-[#181b1f] border-[#383e47] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.9)]'
                      : 'bg-white border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  {/* Floating Window Pinstripe Titlebar */}
                  <div
                    className={`h-6 border-b flex items-center justify-between px-unit-2 overflow-hidden retro-pinstripe-titlebar ${
                      isDark
                        ? 'border-[#383e47] bg-[#22262c]'
                        : 'border-black bg-[#efeee9]'
                    }`}
                  >
                    <div
                      className={`px-unit-2 text-[10px] font-label-sm uppercase font-bold border ${
                        isDark
                          ? 'bg-[#181b1f] border-[#383e47] text-[#cbd0d6]'
                          : 'bg-white border-black text-black'
                      }`}
                    >
                      Review interval tags
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`px-1 border text-[9px] font-mono leading-none cursor-pointer ${
                          isDark
                            ? 'bg-[#181b1f] border-[#383e47] text-[#8b939e]'
                            : 'bg-white border-black text-black'
                        }`}
                      >
                        _
                      </span>
                      <span
                        className={`px-1 border text-[9px] font-mono leading-none cursor-pointer ${
                          isDark
                            ? 'bg-[#181b1f] border-[#383e47] text-[#8b939e] hover:text-white'
                            : 'bg-white border-black text-black'
                        }`}
                      >
                        ✕
                      </span>
                    </div>
                  </div>

                  {/* Floating Window Body */}
                  <div className={`p-unit-3 flex flex-col gap-unit-2 ${isDark ? 'bg-[#181b1f]' : 'bg-white'}`}>
                    <div className={`flex items-center justify-between font-label-sm text-[11px] uppercase font-mono ${
                      isDark ? 'text-[#e6e8eb]' : 'text-black'
                    }`}>
                      <span>RETENTION DECAY (SM-2):</span>
                      <span className={`font-bold font-mono ${
                        isDark ? 'text-[#e6e8eb]' : 'text-[#904d00]'
                      }`}>
                        98.4%
                      </span>
                    </div>

                    {/* Interval Selector Chips */}
                    <div className="grid grid-cols-4 gap-1.5 my-1" id="interval-pills">
                      {(['1D', '3D', '7D', '30D'] as const).map((interval) => {
                        const isSelected = selectedInterval === interval;
                        return (
                          <button
                            key={interval}
                            type="button"
                            onClick={() => setSelectedInterval(interval)}
                            className={`interval-pill font-code-md text-code-md py-1 border text-center transition-none cursor-pointer ${
                              isSelected
                                ? isDark
                                  ? 'bg-[#e6e8eb] text-[#111417] border-[#e6e8eb] font-bold'
                                  : 'bg-black text-white border-black font-bold'
                                : isDark
                                ? 'bg-[#14171b] text-[#cbd0d6] border-[#383e47] hover:border-[#e6e8eb]'
                                : 'bg-[#f5f4ef] text-black border-black hover:bg-[#e9e8e3]'
                            }`}
                          >
                            [{interval}]
                          </button>
                        );
                      })}
                    </div>

                    {/* Decay Trigger Status */}
                    <div
                      className={`font-label-sm text-[10px] flex items-center justify-between border-t pt-1.5 font-mono ${
                        isDark
                          ? 'border-[#2a2e34] text-[#8b939e]'
                          : 'border-[#c5c6cb] text-[#45474a]'
                      }`}
                    >
                      <span>Next decay trigger:</span>
                      <span className={`font-bold font-mono ${
                        isDark ? 'text-[#e6e8eb]' : 'text-black'
                      }`}>
                        in 14h 22m
                      </span>
                    </div>

                    {/* Micro Pixel Progress Bar */}
                    <div
                      className={`w-full h-2 border p-[1px] ${
                        isDark
                          ? 'bg-[#111417] border-[#383e47]'
                          : 'bg-[#e9e8e3] border-black'
                      }`}
                    >
                      <div className={`h-full w-[72%] ${isDark ? 'bg-[#e6e8eb]' : 'bg-black'}`} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ----------------------------------------------------------------
                SECTION 2: THREE-TIER RETENTION COGNITION // 3-CARD SPEC
                ---------------------------------------------------------------- */}
            <section
              id="specs"
              className={`w-full px-gutter-sm md:px-gutter-lg py-unit-8 border-b ${
                isDark
                  ? 'bg-[#14171b] border-[#2a2e34]'
                  : 'bg-[#f5f4ef] border-black/20'
              }`}
            >
              <div className="max-w-6xl mx-auto flex flex-col gap-unit-6">
                {/* Section Header */}
                <div
                  className={`flex flex-col md:flex-row md:items-end justify-between gap-unit-3 border-b-2 pb-unit-3 ${
                    isDark ? 'border-[#383e47]' : 'border-black'
                  }`}
                >
                  <div>
                    <span className={`font-label-sm text-label-sm uppercase tracking-wider font-mono ${
                      isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
                    }`}>
                      ARCHITECTURAL SPECIFICATION // MODULE 02
                    </span>
                    <h2 className={`font-headline-lg text-headline-lg uppercase font-bold mt-1 ${
                      isDark ? 'text-[#e6e8eb]' : 'text-black'
                    }`}>
                      THREE-TIER RETENTION COGNITION
                    </h2>
                  </div>
                  <div
                    className={`font-label-sm text-label-sm border px-unit-3 py-unit-1 font-mono uppercase ${
                      isDark
                        ? 'bg-[#181b1f] border-[#383e47] text-[#cbd0d6]'
                        : 'bg-white border-black text-black'
                    }`}
                  >
                    NO SYNTHETIC NOISE • 100% EXPLICIT
                  </div>
                </div>

                {/* Grid of 3 High-Craft Retro Spec Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-unit-5">
                  {/* Card 1: Concept Graph ASCII */}
                  <div
                    className={`border-2 p-unit-4 flex flex-col justify-between ${
                      isDark
                        ? 'bg-[#181b1f] border-[#383e47] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]'
                        : 'bg-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <div>
                      <div
                        className={`flex items-center justify-between border-b pb-unit-2 mb-unit-3 ${
                          isDark ? 'border-[#2a2e34]' : 'border-black'
                        }`}
                      >
                        <span className={`font-code-md text-code-md font-bold uppercase ${
                          isDark ? 'text-[#e6e8eb]' : 'text-black'
                        }`}>
                          [01_CONCEPT_GRAPH]
                        </span>
                        <span
                          className={`font-label-sm text-[10px] px-1 border uppercase font-mono ${
                            isDark
                              ? 'bg-[#22262c] border-[#383e47] text-[#8b939e]'
                              : 'bg-[#efeee9] border-black text-black'
                          }`}
                        >
                          HIERARCHY
                        </span>
                      </div>
                      <p className={`font-body-sm text-body-sm mb-unit-3 ${
                        isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
                      }`}>
                        Knowledge structured strictly as directed acyclic graphs. You cannot jump into Raft without mastering atomic CAS.
                      </p>
                      {/* ASCII Tree */}
                      <pre
                        className={`font-code-md text-[11px] leading-snug p-unit-3 border overflow-x-auto select-none font-mono ${
                          isDark
                            ? 'bg-[#111417] border-[#383e47] text-[#cbd0d6]'
                            : 'bg-[#f5f4ef] border-black text-black'
                        }`}
                      >
{`ROOT
├── 01_Memory_Safety
│   ├── Borrow_Checker
│   └── Lifetimes
│       ├── Static
│       └── Elision
└── 02_Atomics_CAS
    ├── Acquire_Release
    └── Seq_Cst`}
                      </pre>
                    </div>
                    <div
                      className={`border-t pt-unit-3 mt-unit-4 flex items-center justify-between font-label-sm text-label-sm font-mono ${
                        isDark ? 'border-[#2a2e34]' : 'border-black/20'
                      }`}
                    >
                      <span className={`uppercase ${isDark ? 'text-[#8b939e]' : 'text-[#45474a]'}`}>
                        PREREQ VERIFIED:
                      </span>
                      <span className={`font-bold ${isDark ? 'text-[#56d364]' : 'text-black'}`}>
                        [100% EXPLICIT]
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Markdown Specs Live Preview */}
                  <div
                    className={`border-2 p-unit-4 flex flex-col justify-between ${
                      isDark
                        ? 'bg-[#181b1f] border-[#383e47] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]'
                        : 'bg-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <div>
                      <div
                        className={`flex items-center justify-between border-b pb-unit-2 mb-unit-3 ${
                          isDark ? 'border-[#2a2e34]' : 'border-black'
                        }`}
                      >
                        <span className={`font-code-md text-code-md font-bold uppercase ${
                          isDark ? 'text-[#e6e8eb]' : 'text-black'
                        }`}>
                          [02_MARKDOWN_SPECS]
                        </span>
                        <span
                          className={`font-label-sm text-[10px] px-1 border uppercase font-bold font-mono ${
                            isDark
                              ? 'bg-[#22262c] border-[#383e47] text-[#e6e8eb]'
                              : 'bg-[#ffdcc3] border-black text-[#2f1500]'
                          }`}
                        >
                          RAW SPEC
                        </span>
                      </div>
                      <p className={`font-body-sm text-body-sm mb-unit-3 ${
                        isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
                      }`}>
                        Standardized human-readable RFC-grade markdown. Download, clone, grep, or feed into local LLM tooling.
                      </p>
                      {/* Rendered Mini Spec Block */}
                      <div
                        className={`p-unit-3 border font-code-md text-[11px] leading-relaxed ${
                          isDark
                            ? 'bg-[#111417] border-[#383e47] text-[#cbd0d6]'
                            : 'bg-[#f5f4ef] border-black text-black'
                        }`}
                      >
                        <div
                          className={`font-bold border-b pb-1 ${
                            isDark ? 'border-[#2a2e34] text-[#e6e8eb]' : 'border-black/30 text-black'
                          }`}
                        >
                          ## Paxos vs Raft (Consensus Invariant)
                        </div>
                        <ul className="list-none space-y-1 mt-2">
                          <li>
                            • <span className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Leader Election:</span> Randomized timers [150-300ms]
                          </li>
                          <li>
                            • <span className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Log Matching:</span> If 2 logs contain same index &amp; term...
                          </li>
                          <li>
                            • <span className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Safety Rule:</span> Overwrite uncommitted candidate logs
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div
                      className={`border-t pt-unit-3 mt-unit-4 flex items-center justify-between ${
                        isDark ? 'border-[#2a2e34]' : 'border-black/20'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={handleCopySpec}
                        id="copy-spec-btn"
                        className={`font-label-sm text-label-sm w-full py-unit-2 border uppercase font-bold font-mono transition-none cursor-pointer ${
                          copied
                            ? isDark
                              ? 'bg-[#56d364] text-[#111417] border-[#56d364]'
                              : 'bg-[#fe932c] text-[#2f1500] border-black'
                            : isDark
                            ? 'border-[#383e47] bg-[#22262c] text-[#e6e8eb] hover:bg-[#2c3138] hover:border-[#e6e8eb]'
                            : 'border-black bg-[#efeee9] text-black hover:bg-[#e9e8e3]'
                        }`}
                      >
                        {copied ? '[COPIED TO CLIPBOARD!]' : '[COPY PROTOCOL SPEC]'}
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Spaced Recall Algorithm */}
                  <div
                    className={`border-2 p-unit-4 flex flex-col justify-between ${
                      isDark
                        ? 'bg-[#181b1f] border-[#383e47] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]'
                        : 'bg-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <div>
                      <div
                        className={`flex items-center justify-between border-b pb-unit-2 mb-unit-3 ${
                          isDark ? 'border-[#2a2e34]' : 'border-black'
                        }`}
                      >
                        <span className={`font-code-md text-code-md font-bold uppercase ${
                          isDark ? 'text-[#e6e8eb]' : 'text-black'
                        }`}>
                          [03_SPACED_RECALL]
                        </span>
                        <span
                          className={`font-label-sm text-[10px] px-1 border uppercase font-mono ${
                            isDark
                              ? 'bg-[#22262c] border-[#383e47] text-[#8b939e]'
                              : 'bg-[#efeee9] border-black text-black'
                          }`}
                        >
                          ALGO: SM-2
                        </span>
                      </div>
                      <p className={`font-body-sm text-body-sm mb-unit-3 ${
                        isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
                      }`}>
                        Algorithmic interval scheduling calculated dynamically per node performance. Prevent degradation of foundational principles.
                      </p>
                      {/* Retention Metric Visualizer */}
                      <div
                        className={`p-unit-3 border flex flex-col gap-unit-2 ${
                          isDark
                            ? 'bg-[#111417] border-[#383e47]'
                            : 'bg-[#f5f4ef] border-black'
                        }`}
                      >
                        <div className="flex justify-between items-end">
                          <span className={`font-label-sm text-[10px] uppercase font-mono ${
                            isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
                          }`}>
                            ESTIMATED RECALL:
                          </span>
                          <span className={`font-display-lg text-2xl font-bold font-mono ${
                            isDark ? 'text-[#e6e8eb]' : 'text-black'
                          }`}>
                            &gt;94.2%
                          </span>
                        </div>
                        <div className="flex items-center gap-1 h-6 pt-1">
                          <span
                            className={`h-full flex-1 border ${
                              isDark ? 'bg-[#484f5a] border-[#383e47]' : 'bg-black border-black'
                            }`}
                            title="Day 1"
                          />
                          <span
                            className={`h-[85%] flex-1 border ${
                              isDark ? 'bg-[#484f5a] border-[#383e47]' : 'bg-black border-black'
                            }`}
                            title="Day 3"
                          />
                          <span
                            className={`h-[75%] flex-1 border ${
                              isDark ? 'bg-[#484f5a] border-[#383e47]' : 'bg-black border-black'
                            }`}
                            title="Day 7"
                          />
                          <span
                            className={`h-[90%] flex-1 border ${
                              isDark ? 'bg-[#8b939e] border-[#383e47]' : 'bg-black border-black'
                            }`}
                            title="Day 14"
                          />
                          <span
                            className={`h-[95%] flex-1 border ${
                              isDark ? 'bg-[#e6e8eb] border-[#383e47]' : 'bg-[#fe932c] border-black'
                            }`}
                            title="Day 30"
                          />
                        </div>
                        <div className={`flex justify-between font-label-sm text-[9px] font-mono ${
                          isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
                        }`}>
                          <span>D:01</span>
                          <span>D:03</span>
                          <span>D:07</span>
                          <span>D:14</span>
                          <span>D:30 [STABLE]</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`border-t pt-unit-3 mt-unit-4 flex items-center justify-between font-label-sm text-label-sm font-mono ${
                        isDark ? 'border-[#2a2e34]' : 'border-black/20'
                      }`}
                    >
                      <span className={`uppercase ${isDark ? 'text-[#8b939e]' : 'text-[#45474a]'}`}>
                        DECAY FACTOR:
                      </span>
                      <span className={`font-bold font-mono ${isDark ? 'text-[#e6e8eb]' : 'text-black'}`}>
                        EF: 2.50 [OPTIMAL]
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ----------------------------------------------------------------
                SECTION 3: BITE-SIZED INTERACTIVE TERMINAL DRILL
                ---------------------------------------------------------------- */}
            <section
              id="diagnostic-drill"
              className={`w-full px-gutter-sm md:px-gutter-lg py-unit-8 border-b ${
                isDark ? 'bg-[#111417] border-[#2a2e34]' : 'bg-[#faf9f4] border-black/20'
              }`}
            >
              <div className="max-w-4xl mx-auto">
                {/* Drill Window Frame */}
                <div
                  className={`border-2 ${
                    isDark
                      ? 'bg-[#181b1f] border-[#383e47] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.9)]'
                      : 'bg-white border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  {/* Retro Dialog Titlebar */}
                  <div
                    className={`h-8 border-b-2 flex items-center justify-between px-unit-3 ${
                      isDark
                        ? 'border-[#383e47] bg-[#22262c]'
                        : 'border-black bg-[#efeee9]'
                    }`}
                  >
                    <div className="flex items-center gap-unit-2">
                      <span className={`w-2.5 h-2.5 inline-block ${isDark ? 'bg-[#e6e8eb]' : 'bg-black'}`} />
                      <span className={`font-code-md text-code-md font-bold uppercase ${
                        isDark ? 'text-[#e6e8eb]' : 'text-black'
                      }`}>
                        DIAGNOSTIC_DRILL :: [0x4A] Cache Coherence Protocols
                      </span>
                    </div>
                    <span
                      className={`font-label-sm text-label-sm border px-unit-2 font-mono uppercase ${
                        isDark
                          ? 'border-[#383e47] bg-[#181b1f] text-[#cbd0d6]'
                          : 'border-black bg-white text-black'
                      }`}
                    >
                      TIME_BUDGET: 30s
                    </span>
                  </div>

                  {/* Question Body */}
                  <div className="p-unit-5 md:p-unit-6 flex flex-col gap-unit-4">
                    <div className={`font-headline-sm text-headline-sm ${
                      isDark ? 'text-[#e6e8eb]' : 'text-black'
                    }`}>
                      &quot;Which state transition occurs in the standard MESI protocol when a CPU core issues an exclusive write to a line currently held in the &apos;Shared&apos; state?&quot;
                    </div>

                    {/* Radio-like Selectable Options (Custom White Fill on Select, Never Blue) */}
                    <div className="flex flex-col gap-2.5 mt-unit-2" id="drill-options">
                      {/* Option A */}
                      <label
                        onClick={() => setDrillOption('A')}
                        className={`drill-choice flex items-center gap-unit-3 p-unit-3 cursor-pointer transition-none ${
                          drillOption === 'A'
                            ? isDark
                              ? 'border-2 border-white bg-[#22262c] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]'
                              : 'border-2 border-black bg-[#e3e3de] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            : isDark
                            ? 'border border-[#383e47] bg-[#14171b] hover:bg-[#22262c]'
                            : 'border border-black bg-[#f5f4ef] hover:bg-[#e9e8e3]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="drill"
                          value="A"
                          checked={drillOption === 'A'}
                          onChange={() => setDrillOption('A')}
                          className="sr-only"
                        />
                        {/* Custom Retro Radio: Fills solid white in dark mode, black in light mode, NEVER blue */}
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-none ${
                            drillOption === 'A'
                              ? isDark
                                ? 'border-white bg-[#14171b]'
                                : 'border-black bg-white'
                              : isDark
                              ? 'border-[#484f5a] bg-transparent'
                              : 'border-black/60 bg-transparent'
                          }`}
                        >
                          {drillOption === 'A' && (
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isDark ? 'bg-white' : 'bg-black'
                              }`}
                            />
                          )}
                        </span>
                        <span
                          className={`font-code-md text-code-md font-mono ${
                            drillOption === 'A'
                              ? `font-bold ${isDark ? 'text-[#e6e8eb]' : 'text-black'}`
                              : isDark ? 'text-[#cbd0d6]' : 'text-black'
                          }`}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          [A] Invalid ➔ Modified (Cold Miss allocate)
                        </span>
                      </label>

                      {/* Option B (Correct) */}
                      <label
                        onClick={() => setDrillOption('B')}
                        className={`drill-choice flex items-center gap-unit-3 p-unit-3 cursor-pointer transition-none ${
                          drillOption === 'B'
                            ? isDark
                              ? 'border-2 border-white bg-[#22262c] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]'
                              : 'border-2 border-black bg-[#e3e3de] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            : isDark
                            ? 'border border-[#383e47] bg-[#14171b] hover:bg-[#22262c]'
                            : 'border border-black bg-[#f5f4ef] hover:bg-[#e9e8e3]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="drill"
                          value="B"
                          checked={drillOption === 'B'}
                          onChange={() => setDrillOption('B')}
                          className="sr-only"
                        />
                        {/* Custom Retro Radio: Fills solid white in dark mode, black in light mode, NEVER blue */}
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-none ${
                            drillOption === 'B'
                              ? isDark
                                ? 'border-white bg-[#14171b]'
                                : 'border-black bg-white'
                              : isDark
                              ? 'border-[#484f5a] bg-transparent'
                              : 'border-black/60 bg-transparent'
                          }`}
                        >
                          {drillOption === 'B' && (
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isDark ? 'bg-white' : 'bg-black'
                              }`}
                            />
                          )}
                        </span>
                        <span
                          className={`font-code-md text-code-md font-mono font-bold ${
                            isDark ? 'text-[#e6e8eb]' : 'text-black'
                          }`}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          [B] Shared ➔ Modified [✔ SELECTED: INVAL BROADCAST]
                        </span>
                      </label>

                      {/* Option C */}
                      <label
                        onClick={() => setDrillOption('C')}
                        className={`drill-choice flex items-center gap-unit-3 p-unit-3 cursor-pointer transition-none ${
                          drillOption === 'C'
                            ? isDark
                              ? 'border-2 border-white bg-[#22262c] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]'
                              : 'border-2 border-black bg-[#e3e3de] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            : isDark
                            ? 'border border-[#383e47] bg-[#14171b] hover:bg-[#22262c]'
                            : 'border border-black bg-[#f5f4ef] hover:bg-[#e9e8e3]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="drill"
                          value="C"
                          checked={drillOption === 'C'}
                          onChange={() => setDrillOption('C')}
                          className="sr-only"
                        />
                        {/* Custom Retro Radio: Fills solid white in dark mode, black in light mode, NEVER blue */}
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-none ${
                            drillOption === 'C'
                              ? isDark
                                ? 'border-white bg-[#14171b]'
                                : 'border-black bg-white'
                              : isDark
                              ? 'border-[#484f5a] bg-transparent'
                              : 'border-black/60 bg-transparent'
                          }`}
                        >
                          {drillOption === 'C' && (
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isDark ? 'bg-white' : 'bg-black'
                              }`}
                            />
                          )}
                        </span>
                        <span
                          className={`font-code-md text-code-md font-mono ${
                            drillOption === 'C'
                              ? `font-bold ${isDark ? 'text-[#e6e8eb]' : 'text-black'}`
                              : isDark ? 'text-[#cbd0d6]' : 'text-black'
                          }`}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          [C] Shared ➔ Exclusive (No bus action)
                        </span>
                      </label>
                    </div>

                    {/* Explanation Callout Box */}
                    {showExplanation && (
                      <div
                        className={`p-unit-4 border border-dashed mt-unit-2 ${
                          isDark
                            ? 'bg-[#14171b] border-[#383e47]'
                            : 'bg-[#efeee9] border-black'
                        }`}
                      >
                        <div
                          className={`flex items-center gap-unit-2 font-label-sm text-label-sm font-bold uppercase ${
                            isDark ? 'text-[#56d364]' : 'text-black'
                          }`}
                          style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}
                        >
                          {/* Official Google Material Symbols Outlined verified rosette icon */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 inline-block shrink-0"
                            viewBox="0 -960 960 960"
                            fill="currentColor"
                          >
                            <path d="m344-60-76-128-144-32 14-148-98-112 98-112-14-148 144-32 76-128 136 58 136-58 76 128 144 32-14 148 98 112-98 112 14 148-144 32-76 128-136-58-136 58Zm34-102 102-44 104 44 56-96 110-26-10-112 74-84-74-86 10-112-110-24-58-96-102 44-104-44-56 96-110 24 10 112-74 86 74 84-10 114 110 24 58 96Zm102-318Zm-42 142 226-226-56-58-170 170-86-84-56 56 142 142Z" />
                          </svg>
                          <span style={{ letterSpacing: '0.08em' }}>VERIFICATION INSIGHT:</span>
                        </div>
                        <p
                          className={`font-code-md text-code-md mt-1 ${
                            isDark ? 'text-[#cbd0d6]' : 'text-[#1b1c19]'
                          }`}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          TL;DR: Transitioning from S ➔ M generates an{' '}
                          <strong className={`font-bold underline ${isDark ? 'text-white' : 'text-black'}`}>
                            Invalidation Broadcast
                          </strong>{' '}
                          across the snooping bus to downgrade all other cached copies to Invalid (I) before the local write can proceed.
                        </p>
                      </div>
                    )}

                    {/* Drill Footer Controls */}
                    <div
                      className={`flex flex-wrap items-center justify-between gap-unit-3 border-t pt-unit-4 mt-unit-2 ${
                        isDark ? 'border-[#2a2e34]' : 'border-black/20'
                      }`}
                    >
                      <span className={`font-label-sm text-label-sm font-mono ${
                        isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
                      }`}>
                        STREAK: {streak} CORRECT // DIFFICULTY: L3
                      </span>
                      <div className="flex gap-unit-3">
                        <button
                          type="button"
                          onClick={() => setShowExplanation((prev) => !prev)}
                          className={`font-label-sm text-label-sm px-unit-3 py-unit-2 border uppercase transition-none font-mono cursor-pointer ${
                            isDark
                              ? 'border-[#383e47] bg-[#14171b] text-[#cbd0d6] hover:bg-[#22262c]'
                              : 'border-black bg-white text-black hover:bg-[#e9e8e3]'
                          }`}
                        >
                          [{showExplanation ? 'HIDE EXPLANATION' : 'EXPLAIN CODE'}]
                        </button>
                        <button
                          type="button"
                          onClick={handleNextDrill}
                          className={`font-label-sm text-label-sm px-unit-4 py-unit-2 border uppercase font-bold transition-none font-mono cursor-pointer ${
                            isDark
                              ? 'border-[#e6e8eb] bg-[#e6e8eb] text-[#111417] hover:bg-transparent hover:text-[#e6e8eb] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]'
                              : 'border-black bg-black text-white hover:bg-white hover:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          }`}
                        >
                          [NEXT DRILL →]
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ----------------------------------------------------------------
                SECTION 4: INDEXED CURRICULUM TRACKS TABLE
                ---------------------------------------------------------------- */}
            <section
              id="tracks"
              className={`w-full px-gutter-sm md:px-gutter-lg py-unit-8 border-b ${
                isDark
                  ? 'bg-[#14171b] border-[#2a2e34]'
                  : 'bg-[#f5f4ef] border-black/20'
              }`}
            >
              <div className="max-w-5xl mx-auto flex flex-col gap-unit-5">
                <div
                  className={`flex flex-col md:flex-row md:items-center justify-between gap-unit-2 border-b-2 pb-unit-3 ${
                    isDark ? 'border-[#383e47]' : 'border-black'
                  }`}
                >
                  <div>
                    <span className={`font-label-sm text-label-sm uppercase font-mono ${
                      isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
                    }`}>
                      REGISTRY // LEDGER INDEX
                    </span>
                    <h2 className={`font-headline-lg text-headline-lg uppercase font-bold ${
                      isDark ? 'text-[#e6e8eb]' : 'text-black'
                    }`}>
                      CURRICULUM TRACKS
                    </h2>
                  </div>
                  <span
                    className={`font-label-sm text-label-sm font-mono uppercase px-unit-2 py-unit-1 border ${
                      isDark
                        ? 'bg-[#181b1f] border-[#383e47] text-[#cbd0d6]'
                        : 'bg-[#efeee9] border-black text-black'
                    }`}
                  >
                    4 CORE DISCIPLINES ACTIVE
                  </span>
                </div>

                {/* Retro ASCII Ledger Table */}
                <div
                  className={`border-2 overflow-x-auto ${
                    isDark
                      ? 'border-[#383e47] bg-[#181b1f] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]'
                      : 'border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        className={`font-code-md text-code-md uppercase border-b-2 ${
                          isDark
                            ? 'bg-[#22262c] border-[#383e47] text-[#e6e8eb]'
                            : 'bg-[#efeee9] border-black text-black'
                        }`}
                      >
                        <th className={`py-unit-3 px-unit-4 border-r w-24 ${isDark ? 'border-[#383e47]' : 'border-black'}`}>
                          TRACK_ID
                        </th>
                        <th className={`py-unit-3 px-unit-4 border-r ${isDark ? 'border-[#383e47]' : 'border-black'}`}>
                          DISCIPLINE
                        </th>
                        <th className={`py-unit-3 px-unit-4 border-r hidden md:table-cell ${isDark ? 'border-[#383e47]' : 'border-black'}`}>
                          CORE CONCEPTS INCLUDED
                        </th>
                        <th className={`py-unit-3 px-unit-4 border-r text-right w-24 ${isDark ? 'border-[#383e47]' : 'border-black'}`}>
                          NODES
                        </th>
                        <th className="py-unit-3 px-unit-4 text-center w-28">
                          ACTION
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y font-code-md text-[13px] ${
                        isDark ? 'divide-[#2a2e34]' : 'divide-black'
                      }`}
                    >
                      {/* Row 1: Distributed Systems */}
                      <tr className={`transition-none ${isDark ? 'hover:bg-[#22262c]' : 'hover:bg-[#efeee9]'}`}>
                        <td className={`py-unit-3 px-unit-4 border-r font-bold ${isDark ? 'border-[#383e47] text-[#e6e8eb]' : 'border-black text-black'}`}>
                          TRK-01
                        </td>
                        <td className={`py-unit-3 px-unit-4 border-r font-bold ${isDark ? 'border-[#383e47] text-[#e6e8eb]' : 'border-black text-black'}`}>
                          Distributed Systems
                        </td>
                        <td className={`py-unit-3 px-unit-4 border-r hidden md:table-cell ${isDark ? 'border-[#383e47] text-[#8b939e]' : 'border-black text-[#45474a]'}`}>
                          Raft, 2PC, Gossip Protocol, Vector Clocks, CRDTs
                        </td>
                        <td className={`py-unit-3 px-unit-4 border-r text-right font-mono ${isDark ? 'border-[#383e47] text-[#cbd0d6]' : 'border-black text-black'}`}>
                          48
                        </td>
                        <td className="py-unit-3 px-unit-4 text-center">
                          <Link
                            href={isAuthenticated ? '/student/roadmaps' : '/login'}
                            className={`inline-block px-unit-3 py-1 font-bold text-[11px] uppercase border transition-none font-mono ${
                              isDark
                                ? 'bg-[#e6e8eb] text-[#111417] border-[#e6e8eb] hover:bg-transparent hover:text-[#e6e8eb] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]'
                                : 'bg-black text-white border-black hover:bg-white hover:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            }`}
                          >
                            [OPEN]
                          </Link>
                        </td>
                      </tr>

                      {/* Row 2: Concurrency & Memory Models */}
                      <tr className={`transition-none ${isDark ? 'bg-[#14171b]/60 hover:bg-[#22262c]' : 'bg-[#f5f4ef]/50 hover:bg-[#efeee9]'}`}>
                        <td className={`py-unit-3 px-unit-4 border-r font-bold ${isDark ? 'border-[#383e47] text-[#e6e8eb]' : 'border-black text-black'}`}>
                          TRK-02
                        </td>
                        <td className={`py-unit-3 px-unit-4 border-r font-bold ${isDark ? 'border-[#383e47] text-[#e6e8eb]' : 'border-black text-black'}`}>
                          Concurrency &amp; Memory Models
                        </td>
                        <td className={`py-unit-3 px-unit-4 border-r hidden md:table-cell ${isDark ? 'border-[#383e47] text-[#8b939e]' : 'border-black text-[#45474a]'}`}>
                          CAS, Sequential Consistency, Memory Fences, Lock-Free Queues
                        </td>
                        <td className={`py-unit-3 px-unit-4 border-r text-right font-mono ${isDark ? 'border-[#383e47] text-[#cbd0d6]' : 'border-black text-black'}`}>
                          36
                        </td>
                        <td className="py-unit-3 px-unit-4 text-center">
                          <Link
                            href={isAuthenticated ? '/student/roadmaps' : '/login'}
                            className={`inline-block px-unit-3 py-1 font-bold text-[11px] uppercase border transition-none font-mono ${
                              isDark
                                ? 'bg-[#e6e8eb] text-[#111417] border-[#e6e8eb] hover:bg-transparent hover:text-[#e6e8eb] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]'
                                : 'bg-black text-white border-black hover:bg-white hover:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            }`}
                          >
                            [OPEN]
                          </Link>
                        </td>
                      </tr>

                      {/* Row 3: Networking & Wire Protocols */}
                      <tr className={`transition-none ${isDark ? 'hover:bg-[#22262c]' : 'hover:bg-[#efeee9]'}`}>
                        <td className={`py-unit-3 px-unit-4 border-r font-bold ${isDark ? 'border-[#383e47] text-[#e6e8eb]' : 'border-black text-black'}`}>
                          TRK-03
                        </td>
                        <td className={`py-unit-3 px-unit-4 border-r font-bold ${isDark ? 'border-[#383e47] text-[#e6e8eb]' : 'border-black text-black'}`}>
                          Networking &amp; Wire Protocols
                        </td>
                        <td className={`py-unit-3 px-unit-4 border-r hidden md:table-cell ${isDark ? 'border-[#383e47] text-[#8b939e]' : 'border-black text-[#45474a]'}`}>
                          QUIC, Epoll, TCP State Machine, Zero-Copy Ringbuffers
                        </td>
                        <td className={`py-unit-3 px-unit-4 border-r text-right font-mono ${isDark ? 'border-[#383e47] text-[#cbd0d6]' : 'border-black text-black'}`}>
                          42
                        </td>
                        <td className="py-unit-3 px-unit-4 text-center">
                          <Link
                            href={isAuthenticated ? '/student/roadmaps' : '/login'}
                            className={`inline-block px-unit-3 py-1 font-bold text-[11px] uppercase border transition-none font-mono ${
                              isDark
                                ? 'bg-[#e6e8eb] text-[#111417] border-[#e6e8eb] hover:bg-transparent hover:text-[#e6e8eb] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]'
                                : 'bg-black text-white border-black hover:bg-white hover:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            }`}
                          >
                            [OPEN]
                          </Link>
                        </td>
                      </tr>

                      {/* Row 4: OS Internals & Compilers */}
                      <tr className={`transition-none ${isDark ? 'bg-[#14171b]/60 hover:bg-[#22262c]' : 'bg-[#f5f4ef]/50 hover:bg-[#efeee9]'}`}>
                        <td className={`py-unit-3 px-unit-4 border-r font-bold ${isDark ? 'border-[#383e47] text-[#e6e8eb]' : 'border-black text-black'}`}>
                          TRK-04
                        </td>
                        <td className={`py-unit-3 px-unit-4 border-r font-bold ${isDark ? 'border-[#383e47] text-[#e6e8eb]' : 'border-black text-black'}`}>
                          OS Internals &amp; Compilers
                        </td>
                        <td className={`py-unit-3 px-unit-4 border-r hidden md:table-cell ${isDark ? 'border-[#383e47] text-[#8b939e]' : 'border-black text-[#45474a]'}`}>
                          Virtual Memory, TLB Shootdown, Syscalls, ELF Loaders, SSA
                        </td>
                        <td className={`py-unit-3 px-unit-4 border-r text-right font-mono ${isDark ? 'border-[#383e47] text-[#cbd0d6]' : 'border-black text-black'}`}>
                          54
                        </td>
                        <td className="py-unit-3 px-unit-4 text-center">
                          <Link
                            href={isAuthenticated ? '/student/roadmaps' : '/login'}
                            className={`inline-block px-unit-3 py-1 font-bold text-[11px] uppercase border transition-none font-mono ${
                              isDark
                                ? 'bg-[#e6e8eb] text-[#111417] border-[#e6e8eb] hover:bg-transparent hover:text-[#e6e8eb] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]'
                                : 'bg-black text-white border-black hover:bg-white hover:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            }`}
                          >
                            [OPEN]
                          </Link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ----------------------------------------------------------------
                SECTION 5: CTA BANNER // INITIALIZE LEARNING SESSION
                ---------------------------------------------------------------- */}
            <section
              className={`w-full px-gutter-sm md:px-gutter-lg py-unit-8 ${
                isDark ? 'bg-[#111417]' : 'bg-[#faf9f4]'
              }`}
            >
              <div
                className={`max-w-4xl mx-auto border-2 border-dashed p-unit-6 md:p-unit-8 text-center flex flex-col items-center ${
                  isDark
                    ? 'border-[#484f5a] bg-[#181b1f] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]'
                    : 'border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <span
                  className={`font-label-sm text-label-sm border px-unit-2 py-0.5 uppercase font-mono mb-unit-3 ${
                    isDark
                      ? 'border-[#383e47] bg-[#14171b] text-[#cbd0d6]'
                      : 'border-black bg-[#efeee9] text-black'
                  }`}
                >
                  ZERO FRICTION ENTRY // LOCAL-FIRST
                </span>

                <h2 className={`font-headline-lg text-headline-lg uppercase font-bold ${
                  isDark ? 'text-[#e6e8eb]' : 'text-black'
                }`}>
                  INITIALIZE LEARNING SESSION
                </h2>

                <p className={`font-body-md text-body-md max-w-xl mt-unit-3 leading-relaxed ${
                  isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
                }`}>
                  Start reviewing immediately without an account. Export your node mastery progress as an open-format JSON schema anytime.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-unit-4 mt-unit-6">
                  <Link
                    href={isAuthenticated ? '/student/dashboard' : '/register'}
                    className={`font-label-md text-label-md retro-cta-btn px-unit-6 py-unit-3 font-bold border uppercase transition-none active:translate-x-[2px] active:translate-y-[2px] ${
                      isDark
                        ? 'bg-[#e6e8eb] text-[#111417] border-[#e6e8eb] hover:bg-transparent hover:text-[#e6e8eb] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] font-mono'
                        : 'bg-black text-white border-black hover:bg-white hover:text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    [BOOTSTRAP SESSION ➔]
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      alert('Progress schema: KIP_V3. Ready for export/import.');
                    }}
                    className={`font-label-md text-label-md retro-cta-btn px-unit-5 py-unit-3 font-bold border uppercase transition-none cursor-pointer active:translate-x-[2px] active:translate-y-[2px] ${
                      isDark
                        ? 'bg-transparent text-[#e6e8eb] border-[#484f5a] hover:border-[#e6e8eb] hover:bg-[#22262c] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] font-mono'
                        : 'bg-white text-black border-black hover:bg-[#e9e8e3] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    [IMPORT PROGRESS.JSON]
                  </button>
                </div>

                <div className={`mt-unit-5 font-code-md text-[11px] flex items-center gap-unit-2 font-mono ${
                  isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
                }`}>
                  <span>SCHEMA: KIP_V3.JSON</span>
                  <span>•</span>
                  <span>ENCRYPTED LOCAL STORAGE</span>
                  <span>•</span>
                  <span>NO TELEMETRY</span>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* ====================================================================
            FOOTER // RETRO SYSTEM STATUS
            ==================================================================== */}
        <footer
          className={`w-full border-t transition-colors duration-200 ${
            isDark
              ? 'bg-[#14171b] border-[#2a2e34]'
              : 'bg-[#f5f4ef] border-black/20'
          }`}
        >
          <div className="w-full px-gutter-lg py-unit-3 flex flex-col md:flex-row items-center justify-between gap-unit-4">
            <div className={`font-label-sm text-label-sm uppercase tracking-wider font-mono ${
              isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
            }`}>
              KIP © 2026 • ZERO COOKIES • ZERO TRACKERS
            </div>

            <div className={`flex items-center gap-unit-2 font-label-sm text-label-sm uppercase font-mono ${
              isDark ? 'text-[#cbd0d6]' : 'text-black'
            }`}>
              <span
                className={`inline-block w-2 h-2 rounded-full animate-pulse ${
                  isDark ? 'bg-[#56d364]' : 'bg-[#fe932c]'
                }`}
              />
              <span>● DAEMON RUNNING // LATENCY &lt; 4ms</span>
            </div>

            <div className={`flex items-center gap-unit-3 font-label-sm text-label-sm ${
              isDark ? 'text-[#8b939e]' : 'text-[#45474a]'
            }`}>
              <span
                className={`px-unit-2 py-unit-1 border ${
                  isDark
                    ? 'border-[#383e47] bg-[#181b1f] text-[#e6e8eb]'
                    : 'border-[#c5c6cb] bg-white text-black'
                }`}
              >
                [ESC: CLOSE]
              </span>
              <span
                className={`px-unit-2 py-unit-1 border ${
                  isDark
                    ? 'border-[#383e47] bg-[#181b1f] text-[#e6e8eb]'
                    : 'border-[#c5c6cb] bg-white text-black'
                }`}
              >
                [?: SHORTCUTS]
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
