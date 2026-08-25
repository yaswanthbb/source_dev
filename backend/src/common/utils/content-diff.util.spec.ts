import {
  boundedLevenshtein,
  hasSignificantContentChange,
} from './content-diff.util';

describe('content-diff util', () => {
  describe('boundedLevenshtein', () => {
    it('returns 0 for identical strings', () => {
      expect(boundedLevenshtein('same text', 'same text')).toBe(0);
    });

    it('returns the other string length (capped) when one side is empty', () => {
      expect(boundedLevenshtein('', 'abc')).toBe(3);
      expect(boundedLevenshtein('abc', '')).toBe(3);
      // capped at the threshold when the non-empty side is longer than it
      expect(boundedLevenshtein('', 'x'.repeat(50), 40)).toBe(40);
    });

    it('computes exact distance for small edits below the threshold', () => {
      expect(boundedLevenshtein('kitten', 'sitting')).toBe(3); // classic
      expect(boundedLevenshtein('hello', 'hallo')).toBe(1); // substitution
      expect(boundedLevenshtein('cat', 'cats')).toBe(1); // insertion
    });

    it('handles the longer string being first (internal swap)', () => {
      expect(boundedLevenshtein('abcdef', 'abc')).toBe(3);
    });

    it('short-circuits to the threshold when the length difference alone exceeds it', () => {
      expect(boundedLevenshtein('a', 'a'.repeat(50), 40)).toBe(40);
    });

    it('caps the result at the threshold for large edits between similar-length strings', () => {
      // equal lengths (no length short-circuit) but every character differs
      expect(boundedLevenshtein('a'.repeat(50), 'b'.repeat(50), 40)).toBe(40);
    });

    it('honors a custom threshold', () => {
      expect(boundedLevenshtein('a'.repeat(10), 'b'.repeat(10), 5)).toBe(5);
      expect(boundedLevenshtein('abcde', 'abcdf', 3)).toBe(1);
    });
  });

  describe('hasSignificantContentChange', () => {
    it('is false for identical content', () => {
      expect(hasSignificantContentChange('unchanged', 'unchanged')).toBe(false);
    });

    it('is false for a trivial edit under the threshold', () => {
      expect(hasSignificantContentChange('The cat sat.', 'The cat sat!')).toBe(
        false,
      );
    });

    it('is true once the edit distance reaches the threshold', () => {
      expect(hasSignificantContentChange('a', 'a' + 'x'.repeat(60))).toBe(true);
    });

    it('treats filling in empty content as significant when large enough', () => {
      expect(hasSignificantContentChange('', 'x'.repeat(50))).toBe(true);
    });

    it('honors a custom threshold', () => {
      expect(hasSignificantContentChange('abcde', 'abxye', 3)).toBe(false); // distance 2 < 3
      expect(hasSignificantContentChange('abcde', 'abxye', 2)).toBe(true); // distance 2 >= 2
    });
  });
});
