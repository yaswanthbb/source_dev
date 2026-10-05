import {
  conceptOriginLabel,
  rollupOriginLabel,
  parseOriginLabel,
} from './origin-label.util';

describe('origin-label (§4)', () => {
  describe('conceptOriginLabel', () => {
    it('labels generated concepts ai', () => {
      expect(conceptOriginLabel(true)).toBe('ai');
    });

    it('labels hand-written concepts handwritten', () => {
      expect(conceptOriginLabel(false)).toBe('handwritten');
    });
  });

  describe('rollupOriginLabel', () => {
    it('returns null for empty input', () => {
      expect(rollupOriginLabel([])).toBeNull();
    });

    it('returns ai only when every child is ai', () => {
      expect(rollupOriginLabel(['ai', 'ai'])).toBe('ai');
    });

    it('returns handwritten only when every child is handwritten', () => {
      expect(rollupOriginLabel(['handwritten', 'handwritten'])).toBe(
        'handwritten',
      );
    });

    it('returns partial on any mix, including nested partials', () => {
      expect(rollupOriginLabel(['ai', 'handwritten'])).toBe('partial');
      expect(rollupOriginLabel(['ai', 'partial'])).toBe('partial');
      expect(rollupOriginLabel(['handwritten', 'partial'])).toBe('partial');
    });
  });

  describe('parseOriginLabel', () => {
    it('passes through undefined', () => {
      expect(parseOriginLabel(undefined)).toBeUndefined();
    });

    it('accepts the three valid labels', () => {
      expect(parseOriginLabel('ai')).toBe('ai');
      expect(parseOriginLabel('handwritten')).toBe('handwritten');
      expect(parseOriginLabel('partial')).toBe('partial');
    });

    it('rejects anything else', () => {
      expect(() => parseOriginLabel('human')).toThrow();
    });
  });
});
