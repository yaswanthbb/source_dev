'use client';

import { useState, useRef, useCallback } from 'react';
import { getToken } from '@/lib/auth';

interface StreamOptions {
  onChunk?: (delta: string, fullText: string) => void;
  onDone?: (fullText: string) => void;
  onError?: (errorMessage: string) => void;
}

export function useAiStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(
    async (
      endpoint: string,
      payload: Record<string, unknown>,
      options: StreamOptions = {},
    ) => {
      // Abort any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsStreaming(true);
      setError(null);

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const url = `${baseUrl}${cleanEndpoint}`;

      const token = getToken();
      let accumulated = '';

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (response.status === 429) {
          let msg =
            'Daily AI generation limit reached (20/day). Please try again tomorrow (UTC).';
          try {
            const data = await response.json();
            if (data?.message) msg = data.message;
          } catch {
            // ignore
          }
          setError(msg);
          options.onError?.(msg);
          setIsStreaming(false);
          return;
        }

        if (!response.ok) {
          let errorMsg = `Server error (${response.status})`;
          try {
            const data = await response.json();
            if (data?.message) errorMsg = data.message;
          } catch {
            // ignore
          }
          setError(errorMsg);
          options.onError?.(errorMsg);
          setIsStreaming(false);
          return;
        }

        if (!response.body) {
          throw new Error('Readable stream not supported or empty body.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;

            if (trimmed === 'data: [DONE]') {
              setIsStreaming(false);
              options.onDone?.(accumulated);
              return;
            }

            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.error) {
                  setError(parsed.error);
                  options.onError?.(parsed.error);
                  setIsStreaming(false);
                  return;
                }
                if (typeof parsed.content === 'string') {
                  accumulated += parsed.content;
                  options.onChunk?.(parsed.content, accumulated);
                }
              } catch {
                // partial chunk or unparseable line
              }
            }
          }
        }

        // Process leftover buffer
        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              if (typeof parsed.content === 'string') {
                accumulated += parsed.content;
                options.onChunk?.(parsed.content, accumulated);
              }
            } catch {
              // ignore
            }
          }
        }

        setIsStreaming(false);
        options.onDone?.(accumulated);
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          // Manually aborted by user
          setIsStreaming(false);
          return;
        }
        const error = err as Error;
        const msg = error.message || 'Failed to stream response';
        setError(msg);
        options.onError?.(msg);
        setIsStreaming(false);
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [],
  );

  return {
    isStreaming,
    error,
    startStream,
    abortStream,
  };
}
