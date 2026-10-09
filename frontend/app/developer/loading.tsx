"use client";

import React, { useState } from "react";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";

export default function DeveloperRouteLoading() {
  const [shouldSkip] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const val = sessionStorage.getItem("sd_just_logged_in");
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
    <ModeAwareLoader
      minDuration={2000}
      title="developer // runtime_sync"
      stage="STAGE_02"
    />
  );
}
