import React from 'react';

export default function StudentRouteLoading() {
  return (
    <div className="space-y-8 animate-pulse max-w-6xl">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="w-48 h-8 bg-border/60 rounded-xl" />
        <div className="w-80 h-4 bg-border/40 rounded-lg" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-surface border border-border flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-border/50" />
            <div className="space-y-2 flex-1">
              <div className="w-1/2 h-3 bg-border/50 rounded" />
              <div className="w-3/4 h-6 bg-border/60 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Section Skeleton */}
      <div className="p-8 rounded-2xl bg-surface border border-border space-y-4">
        <div className="w-1/3 h-6 bg-border/60 rounded-lg" />
        <div className="w-full h-32 bg-border/30 rounded-xl" />
      </div>
    </div>
  );
}
