/**
 * Timezone detection and per-user time formatting.
 *
 * Accounts are created without ever asking for a timezone, so the browser's
 * own zone is the only signal available — and it is a good one. The column
 * default (UTC) stays as the fallback for API clients that send nothing.
 *
 * Everything rendered to a user should go through the formatters here rather
 * than slicing an ISO string, which silently renders UTC.
 */

import apiClient from "@/lib/api-client";

/** The browser's IANA zone, e.g. `Asia/Kolkata`. `undefined` if unavailable
 *  (ancient browser, or `Intl` stripped), in which case the caller omits the
 *  field and the server default applies. */
export function detectTimezone(): string | undefined {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || undefined;
  } catch {
    return undefined;
  }
}

/** A zone that is safe to hand to `Intl`, falling back to the browser's own
 *  and finally to UTC. A stored zone should never be able to throw at render. */
export function safeZone(timezone?: string | null): string {
  if (timezone) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
      return timezone;
    } catch {
      // Fall through to the browser's zone.
    }
  }
  return detectTimezone() ?? "UTC";
}

/** `HH:MM:SS` in the user's zone — the event-log and clock format. */
export function formatClock(
  value: string | number | Date,
  timezone?: string | null,
): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: safeZone(timezone),
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

/** `YYYY-MM-DD` in the user's zone. `en-CA` yields exactly that order. */
export function formatDate(
  value: string | number | Date,
  timezone?: string | null,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: safeZone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

/** The short zone label, e.g. `IST` or `GMT+5:30`, for labelling timestamps. */
export function zoneAbbrev(timezone?: string | null): string {
  const zone = safeZone(timezone);
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "short",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? zone;
  } catch {
    return zone;
  }
}

/**
 * Set the timezone on an account that was just created through a provider
 * redirect, which carries no timezone of its own. Failure is silent: the
 * account is already usable on UTC, and `timezone auto` can fix it later.
 */
export async function syncTimezoneForNewAccount(): Promise<void> {
  const timezone = detectTimezone();
  if (!timezone) return;
  try {
    await apiClient.patch("/users/me", { timezone });
  } catch {
    // Not worth interrupting a successful sign-in over.
  }
}
