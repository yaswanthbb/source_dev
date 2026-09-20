'use client';

import React, { useState } from 'react';
import { MinimalTerminalLoader } from '@/components/loaders/minimal-terminal-loader';

export default function RootLoading() {
  const [shouldSkip] = useState(() => {
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

  if (shouldSkip) {
    return null;
  }

  return (
    <MinimalTerminalLoader
      minDuration={2000}
      title="source-dev // sys_sync"
      stage="BOOT_01"
    />
  );
}
