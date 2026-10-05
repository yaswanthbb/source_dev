/**
 * §8 research (RAG) text utilities — pure functions, no Nest/DB.
 * Token math is approximate (chars/4); chunking is word-based and
 * deterministic so ingestion is reproducible.
 */

/** ~500-token chunks with ~50-token overlap, in characters. */
export const RESEARCH_CHUNK_CHARS = 2000;
export const RESEARCH_OVERLAP_CHARS = 200;

/** Verbatim filter: 8-gram overlap above this ratio (with ≥3 hits) triggers. */
export const VERBATIM_NGRAM = 8;
export const VERBATIM_OVERLAP_THRESHOLD = 0.02;
export const VERBATIM_MIN_HITS = 3;

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

/** Sliding word window: deterministic, sentence-agnostic, overlap-preserving. */
export function chunkText(
  text: string,
  chunkChars: number = RESEARCH_CHUNK_CHARS,
  overlapChars: number = RESEARCH_OVERLAP_CHARS,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const chunks: string[] = [];
  // Word counts approximating the char budgets (avg English word ~5 chars).
  const chunkWords = Math.max(50, Math.floor(chunkChars / 5));
  const stepWords = Math.max(10, Math.floor((chunkChars - overlapChars) / 5));
  for (let start = 0; start < words.length; start += stepWords) {
    const slice = words.slice(start, start + chunkWords);
    if (slice.length === 0) break;
    chunks.push(slice.join(' '));
    if (start + chunkWords >= words.length) break;
  }
  return chunks;
}

/** Minimal HTML→text: drops scripts/styles/nav, keeps block structure. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<\/(p|div|section|article|h[1-6]|li|tr|br)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Parses a stored embedding (JSON array string, incl. pgvector output). */
export function parseEmbedding(stored: string | null): number[] | null {
  if (!stored) return null;
  try {
    const parsed: unknown = JSON.parse(stored);
    if (
      !Array.isArray(parsed) ||
      parsed.length === 0 ||
      !parsed.every((v) => typeof v === 'number' && Number.isFinite(v))
    ) {
      return null;
    }
    return parsed as number[];
  } catch {
    return null;
  }
}

function normalizeForOverlap(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function ngramSet(words: string[], n: number): Set<string> {
  const grams = new Set<string>();
  for (let i = 0; i + n <= words.length; i += 1) {
    grams.add(words.slice(i, i + n).join(' '));
  }
  return grams;
}

export interface VerbatimOverlap {
  /** Fraction of the content's 8-grams found verbatim in the chunks. */
  ratio: number;
  hits: number;
  total: number;
  triggered: boolean;
}

/**
 * Copyright guard: measures how much of `content` lifts verbatim 8-grams
 * from the retrieved chunks. Triggers above threshold (with a hit floor so
 * tiny contents don't false-positive on boilerplate).
 */
export function verbatimOverlap(
  content: string,
  chunkTexts: string[],
  n: number = VERBATIM_NGRAM,
): VerbatimOverlap {
  const contentWords = normalizeForOverlap(content);
  const total = Math.max(0, contentWords.length - n + 1);
  if (total === 0 || chunkTexts.length === 0) {
    return { ratio: 0, hits: 0, total, triggered: false };
  }
  const corpus = new Set<string>();
  for (const chunk of chunkTexts) {
    for (const gram of ngramSet(normalizeForOverlap(chunk), n)) {
      corpus.add(gram);
    }
  }
  let hits = 0;
  for (const gram of ngramSet(contentWords, n)) {
    if (corpus.has(gram)) hits += 1;
  }
  const ratio = hits / total;
  return {
    ratio,
    hits,
    total,
    triggered: hits >= VERBATIM_MIN_HITS && ratio > VERBATIM_OVERLAP_THRESHOLD,
  };
}
