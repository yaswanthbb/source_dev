import { AssessmentItem } from './assessment';

export interface LintCheck {
  code: string;
  passed: boolean;
}
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
const words = (s: string) => normalize(s).split(' ').filter(Boolean);
const contentWords = (s: string) =>
  words(s).filter(
    (w) =>
      w.length > 3 &&
      ![
        'which',
        'what',
        'following',
        'would',
        'should',
        'this',
        'that',
        'with',
        'from',
        'does',
        'when',
        'where',
        'have',
        'most',
        'best',
      ].includes(w),
  );

/** Conservative structural lint, not a substitute for independent subject-matter verification.
 * Semantic correctness is supplied by the fresh verifier's defensible indexes.
 */
export class McqLintService {
  lint(q: AssessmentItem, defensibleIndexes?: number[]) {
    const checks: LintCheck[] = [];
    const add = (code: string, passed: boolean) =>
      checks.push({ code, passed });
    const stem = q.questionText;
    const texts = q.options.map((o) => o.optionText);
    const normalized = texts.map(normalize);
    const position = q.options.findIndex((o) => o.isCorrect);
    add(
      'STEM_COMPLETE',
      words(stem).length >= 5 &&
        /[?:.]$/.test(stem.trim()) &&
        /\b(what|which|how|why|when|where|who|select|choose|identify|determine|calculate|predict)\b/i.test(
          stem,
        ),
    );
    const negatives = [...stem.matchAll(/\b(not|except|least)\b/gi)];
    add(
      'NEGATIVE_EMPHASIS',
      negatives.every(
        (m) =>
          m[0] === m[0].toUpperCase() ||
          new RegExp(`\\*\\*${m[0]}\\*\\*`, 'i').test(stem),
      ),
    );
    add(
      'NO_ALL_ABOVE',
      !texts.some((t) => /\ball\s+of\s+the\s+above\b/i.test(t)),
    );
    add(
      'NULL_SET_ONLY',
      texts.every(
        (t, i) =>
          !/\bnone\s+of\s+the\s+above\b/i.test(t) ||
          (i === position && q.nullSetCorrect === true),
      ),
    );
    add('NO_DUPLICATES', new Set(normalized).size === normalized.length);
    add(
      'OPTIONS_INDEPENDENT',
      !normalized.some((a, i) =>
        normalized.some(
          (b, j) => i !== j && a !== b && ` ${b} `.includes(` ${a} `),
        ),
      ),
    );
    const kinds = texts.map((t) =>
      /^[-+]?\d+(\.\d+)?(\s*[%a-z]+)?$/i.test(t.trim())
        ? 'number'
        : /^(true|false)$/i.test(t.trim())
          ? 'boolean'
          : 'text',
    );
    add('OPTIONS_HOMOGENEOUS', new Set(kinds).size <= 1);
    // Detect mixed phrase/sentence continuations for a completion stem.
    add(
      'GRAMMAR_COMPATIBLE',
      !/:$/.test(stem.trim()) ||
        texts.every((t) => /^[A-Z\d`]/.test(t)) ||
        texts.every((t) => /^[a-z]/.test(t)),
    );
    const lengths = texts.map((t) => words(t).length);
    const sorted = [...lengths].sort((a, b) => a - b);
    const median = sorted.length
      ? sorted[Math.floor((sorted.length - 1) / 2)]
      : 0;
    add(
      'LENGTH_OUTLIER',
      !lengths.some((n) => n >= 8 && n > Math.max(1, median) * 2),
    );
    add(
      'ISOLATED_ABSOLUTE',
      !['always', 'never', 'only'].some(
        (word) =>
          texts.filter((t) => new RegExp(`\\b${word}\\b`, 'i').test(t))
            .length === 1,
      ),
    );
    const correctTerms = position >= 0 ? contentWords(texts[position]) : [];
    const stemTerms = new Set(contentWords(stem));
    const overlap = correctTerms.filter((w) => stemTerms.has(w)).length;
    const otherOverlap = texts.some(
      (t, i) => i !== position && contentWords(t).some((w) => stemTerms.has(w)),
    );
    add(
      'LEXICAL_KEY_LEAK',
      !correctTerms.length ||
        otherOverlap ||
        overlap / correctTerms.length < 0.8,
    );
    add(
      'SINGLE_CORRECT',
      q.options.filter((o) => o.isCorrect).length === 1 &&
        (!defensibleIndexes ||
          (defensibleIndexes.length === 1 &&
            defensibleIndexes[0] === position)),
    );
    add('POSITION_RECORDED', position >= 0);
    return {
      passed: checks.every((c) => c.passed),
      checks,
      correctPosition: position + 1,
      semanticCheck: defensibleIndexes ? 'verified' : 'unavailable',
    };
  }
}
