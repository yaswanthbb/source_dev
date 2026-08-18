'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import apiClient from '../lib/api-client';

export interface AiQuotaBadgeProps {
  className?: string;
  refreshTrigger?: number;
}

export function AiQuotaBadge({
  className = '',
  refreshTrigger = 0,
}: AiQuotaBadgeProps) {
  const [quota, setQuota] = useState<{ remaining: number; limit: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const fetchQuota = useCallback(async () => {
    try {
      const res = await apiClient.get('/ai-generate/quota');
      if (res.data && typeof res.data.remaining === 'number') {
        setQuota({
          remaining: res.data.remaining,
          limit: res.data.limit || 20,
        });
      }
    } catch {
      // Quota fetch may fail if not logged in or backend down, silently omit
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota, refreshTrigger]);

  if (loading || !quota) {
    return null;
  }

  const isLow = quota.remaining <= 5;
  const isOut = quota.remaining === 0;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
        isOut
          ? 'bg-red-tint border-red/20 text-red'
          : isLow
            ? 'bg-amber-tint border-amber/20 text-amber'
            : 'bg-accent-tint border-accent/20 text-accent'
      } ${className}`}
      title={`${quota.remaining} out of ${quota.limit} AI generations remaining today (resets at 00:00 UTC)`}
    >
      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
      <span>
        {quota.remaining}/{quota.limit} AI generations left
      </span>
    </div>
  );
}
