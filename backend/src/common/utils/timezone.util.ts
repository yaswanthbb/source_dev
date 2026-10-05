/**
 * Civil-date helpers for per-user timezones.
 *
 * Streaks, review due-dates and the activity heatmap are all "what day is it
 * for *this* user" questions. Answering them with `new Date().toISOString()`
 * answers "what day is it in UTC" instead, which is a different day for most
 * of the planet for part of every day — in Asia/Kolkata (UTC+5:30) it is wrong
 * from local midnight until 05:30 every single morning.
 *
 * Everything here works on 'YYYY-MM-DD' strings, matching the `date` columns
 * these values are stored in.
 */

/** Fall back to UTC rather than throw: a bad zone should not break a request. */
export function resolveZone(timezone?: string | null): string {
  if (!timezone) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return timezone;
  } catch {
    return 'UTC';
  }
}

/**
 * The calendar date at `instant` as seen in `timezone`, 'YYYY-MM-DD'.
 *
 * `formatToParts` is used rather than a locale string so the output does not
 * depend on the server's locale — `en-US` would otherwise give M/D/YYYY.
 */
export function civilDateIn(
  timezone?: string | null,
  instant: Date = new Date(),
): string {
  const zone = resolveZone(timezone);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);

  const get = (type: 'year' | 'month' | 'day') =>
    parts.find((p) => p.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Shift a 'YYYY-MM-DD' string by whole days.
 *
 * Deliberately pure calendar arithmetic on the civil date — anchoring at UTC
 * noon keeps a DST shift (±1h) from ever rolling the date over, which is the
 * classic bug in naive `setDate` implementations.
 */
export function addCivilDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return anchor.toISOString().slice(0, 10);
}

/** Today in the user's zone. */
export function todayIn(timezone?: string | null): string {
  return civilDateIn(timezone);
}

/** Today ± n days, in the user's zone. */
export function relativeDayIn(
  timezone: string | null | undefined,
  days: number,
): string {
  return addCivilDays(todayIn(timezone), days);
}
