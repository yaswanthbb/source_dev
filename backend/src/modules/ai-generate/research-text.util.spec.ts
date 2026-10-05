import {
  chunkText,
  cosineSimilarity,
  estimateTokens,
  htmlToText,
  parseEmbedding,
  verbatimOverlap,
} from './research-text.util';

function words(n: number, prefix = 'w'): string {
  return Array.from({ length: n }, (_, i) => `${prefix}${i}`).join(' ');
}

describe('research text utils (§8 RAG)', () => {
  describe('chunkText', () => {
    it('windows ~500-token chunks with ~50-token overlap, deterministically', () => {
      const text = words(1000);
      const first = chunkText(text);
      const second = chunkText(text);
      expect(first).toEqual(second);
      expect(first.length).toBe(3);
      // 40-word overlap between consecutive chunks (360-word step).
      const tail = first[0].split(' ').slice(-40).join(' ');
      expect(first[1].startsWith(tail)).toBe(true);
    });

    it('returns short text as a single chunk and empty text as none', () => {
      expect(chunkText('hello world')).toEqual(['hello world']);
      expect(chunkText('   ')).toEqual([]);
    });
  });

  describe('estimateTokens / parseEmbedding', () => {
    it('approximates tokens at chars/4 with a floor of 1', () => {
      expect(estimateTokens('')).toBe(1);
      expect(estimateTokens('abcd')).toBe(1);
      expect(estimateTokens('abcdefgh')).toBe(2);
    });

    it('parses JSON embeddings (incl. pgvector output) and rejects junk', () => {
      expect(parseEmbedding('[1,0.5,-2]')).toEqual([1, 0.5, -2]);
      expect(parseEmbedding(null)).toBeNull();
      expect(parseEmbedding('not json')).toBeNull();
      expect(parseEmbedding('[1,"x"]')).toBeNull();
      expect(parseEmbedding('[]')).toBeNull();
    });
  });

  describe('cosineSimilarity', () => {
    it('scores identical/orthogonal vectors and rejects mismatches', () => {
      expect(cosineSimilarity([1, 1], [1, 1])).toBeCloseTo(1);
      expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
      expect(cosineSimilarity([1, 0], [1, 0, 1])).toBe(0);
    });
  });

  describe('htmlToText', () => {
    it('strips scripts, tags, and decodes entities', () => {
      const out = htmlToText(
        '<html><head><script>evil()</script></head><body><h1>A &amp; B</h1><p>Text&nbsp;here</p></body></html>',
      );
      expect(out).not.toContain('evil');
      expect(out).not.toContain('<');
      expect(out).toContain('A & B');
      expect(out).toContain('Text here');
    });
  });

  describe('verbatimOverlap', () => {
    const passage = words(30, 'lifted');

    it('triggers on a lifted passage inside a longer draft', () => {
      const content = `${words(400, 'filler')} ${passage}`;
      const out = verbatimOverlap(content, [`intro ${passage} outro`]);
      expect(out.triggered).toBe(true);
      expect(out.hits).toBeGreaterThanOrEqual(3);
      expect(out.ratio).toBeGreaterThan(0.02);
    });

    it('stays quiet on original prose and tiny contents', () => {
      expect(
        verbatimOverlap(words(400, 'original'), [
          `other ${words(30, 'lifted')}`,
        ]).triggered,
      ).toBe(false);
      expect(
        verbatimOverlap('short text here', ['short text here']).triggered,
      ).toBe(false);
      expect(verbatimOverlap(words(100), []).triggered).toBe(false);
    });
  });
});
