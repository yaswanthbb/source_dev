import {
  addCivilDays,
  civilDateIn,
  relativeDayIn,
  resolveZone,
  todayIn,
} from './timezone.util';

describe('timezone.util', () => {
  describe('resolveZone', () => {
    it('passes through a valid IANA zone', () => {
      expect(resolveZone('Asia/Kolkata')).toBe('Asia/Kolkata');
    });

    it('falls back to UTC rather than throwing on a bad zone', () => {
      expect(resolveZone('Mars/Olympus')).toBe('UTC');
      expect(resolveZone('')).toBe('UTC');
      expect(resolveZone(null)).toBe('UTC');
      expect(resolveZone(undefined)).toBe('UTC');
    });
  });

  describe('civilDateIn', () => {
    // 20:30Z is already past local midnight in Asia/Kolkata (UTC+5:30).
    // This is the exact case that made streaks wrong.
    const afterLocalMidnight = new Date('2026-09-12T20:30:00Z');

    it('returns the local day, not the UTC day', () => {
      expect(civilDateIn('Asia/Kolkata', afterLocalMidnight)).toBe('2026-09-13');
      expect(civilDateIn('UTC', afterLocalMidnight)).toBe('2026-09-12');
    });

    it('handles zones behind UTC', () => {
      // 02:00Z is still the previous evening in New York.
      expect(
        civilDateIn('America/New_York', new Date('2026-09-12T02:00:00Z')),
      ).toBe('2026-09-11');
    });

    it('handles fractional-hour offsets', () => {
      // +5:45
      expect(
        civilDateIn('Asia/Kathmandu', new Date('2026-09-12T18:20:00Z')),
      ).toBe('2026-09-13');
      // +12:45
      expect(
        civilDateIn('Pacific/Chatham', new Date('2026-09-12T11:20:00Z')),
      ).toBe('2026-09-13');
    });

    it('zero-pads to YYYY-MM-DD', () => {
      expect(civilDateIn('UTC', new Date('2026-01-05T12:00:00Z'))).toBe(
        '2026-01-05',
      );
    });

    it('formats a bad zone as UTC instead of throwing', () => {
      expect(civilDateIn('Mars/Olympus', afterLocalMidnight)).toBe('2026-09-12');
    });
  });

  describe('addCivilDays', () => {
    it('rolls over months and years', () => {
      expect(addCivilDays('2026-09-30', 1)).toBe('2026-10-01');
      expect(addCivilDays('2026-10-01', -1)).toBe('2026-09-30');
      expect(addCivilDays('2026-12-31', 1)).toBe('2027-01-01');
      expect(addCivilDays('2027-01-01', -1)).toBe('2026-12-31');
    });

    it('handles leap years', () => {
      expect(addCivilDays('2028-02-28', 1)).toBe('2028-02-29');
      expect(addCivilDays('2028-02-29', 1)).toBe('2028-03-01');
      expect(addCivilDays('2027-02-28', 1)).toBe('2027-03-01');
    });

    it('steps exactly one day across DST transitions', () => {
      // US spring-forward 2026-03-08 and fall-back 2026-11-01. Anchoring at
      // UTC noon is what keeps a ±1h shift from rolling the date over.
      expect(addCivilDays('2026-03-07', 1)).toBe('2026-03-08');
      expect(addCivilDays('2026-03-08', 1)).toBe('2026-03-09');
      expect(addCivilDays('2026-10-31', 1)).toBe('2026-11-01');
      expect(addCivilDays('2026-11-01', 1)).toBe('2026-11-02');
    });

    it('supports the longest review interval', () => {
      expect(addCivilDays('2026-09-12', 60)).toBe('2026-11-11');
    });

    it('is a no-op for zero', () => {
      expect(addCivilDays('2026-09-12', 0)).toBe('2026-09-12');
    });
  });

  describe('todayIn / relativeDayIn', () => {
    it('agrees with addCivilDays on the same zone', () => {
      const zone = 'Asia/Kolkata';
      const today = todayIn(zone);
      expect(relativeDayIn(zone, 1)).toBe(addCivilDays(today, 1));
      expect(relativeDayIn(zone, -1)).toBe(addCivilDays(today, -1));
      expect(relativeDayIn(zone, 0)).toBe(today);
    });

    it('can differ from the UTC day', () => {
      // Not asserting a specific value — just that both are well-formed and
      // at most one day apart, whenever the suite happens to run.
      const ist = todayIn('Asia/Kolkata');
      const utc = todayIn('UTC');
      expect(ist).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(utc).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect([addCivilDays(utc, 0), addCivilDays(utc, 1)]).toContain(ist);
    });
  });
});
