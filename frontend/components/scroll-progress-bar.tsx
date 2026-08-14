'use client';

import React, { useEffect, useRef, useState } from 'react';

export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const updateTargetProgress = () => {
      const totalHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      if (totalHeight > 0) {
        const currentScroll = window.scrollY || document.documentElement.scrollTop;
        targetProgressRef.current = Math.min(1, Math.max(0, currentScroll / totalHeight));
      } else {
        targetProgressRef.current = 0;
      }
    };

    const animate = () => {
      // Smooth damp interpolation (lerp factor 0.18 for silky fluid glide)
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.0002) {
        currentProgressRef.current += diff * 0.18;
        setProgress(currentProgressRef.current);
      } else if (currentProgressRef.current !== targetProgressRef.current) {
        currentProgressRef.current = targetProgressRef.current;
        setProgress(targetProgressRef.current);
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('scroll', updateTargetProgress, { passive: true });
    window.addEventListener('resize', updateTargetProgress, { passive: true });
    updateTargetProgress();
    currentProgressRef.current = targetProgressRef.current;
    setProgress(targetProgressRef.current);

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', updateTargetProgress);
      window.removeEventListener('resize', updateTargetProgress);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[4.5px] z-[100] pointer-events-none bg-transparent overflow-hidden"
    >
      <div
        className="h-full w-full bg-accent origin-left shadow-[0_0_8px_rgba(59,95,226,0.6)] will-change-transform"
        style={{
          transform: `scaleX(${progress}) translateZ(0)`,
        }}
      />
    </div>
  );
}
