/* ==========================================================================
   KIP Terminal — cancellable requests
   --------------------------------------------------------------------------
   ^C has to stop the work, not just hide it. Every request a command makes
   goes through here, so the host can arm one AbortSignal for the command it
   is running and have the network calls actually abort when the user
   interrupts — rather than resolving later into a screen nobody is watching.

   The signal is module state rather than a parameter because the shell runs
   exactly one command at a time (the host holds a busy lock for the whole
   run). That keeps call sites reading like ordinary requests while still
   being explicit: a call that wants the armed signal says `api`, and one that
   must outlive the command says `apiClient`.
   ========================================================================== */

import apiClient from "@/lib/api-client";

let armed: AbortSignal | undefined;

/** Bind the signal every subsequent `api` call carries. The host arms one per
 *  command and clears it when the command settles. */
export function armRequests(signal?: AbortSignal) {
  armed = signal;
}

const config = () => (armed ? { signal: armed } : undefined);

/** True for the error axios raises when a request is aborted. The dispatcher
 *  treats it as an interrupt rather than a failure, so an aborted command
 *  prints `^C` instead of a red line about a network error. */
export function isAbortError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const name = (error as { name?: string } | null)?.name;
  return code === "ERR_CANCELED" || name === "CanceledError" || name === "AbortError";
}

export const api = {
  get: <T>(url: string) => apiClient.get<T>(url, config()),
  post: <T>(url: string, body?: unknown) =>
    apiClient.post<T>(url, body, config()),
  patch: <T>(url: string, body?: unknown) =>
    apiClient.patch<T>(url, body, config()),
  delete: <T>(url: string) => apiClient.delete<T>(url, config()),
};
