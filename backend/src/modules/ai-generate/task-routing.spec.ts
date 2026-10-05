import { HttpException, HttpStatus } from '@nestjs/common';
import { AiProvider } from '../../common/enums/ai-provider.enum';
import {
  COURSE_TASK_KEYS,
  TASK_ROUTES,
  isCourseTaskKey,
  resolveTierModel,
  taskRouteFor,
} from './task-routing';
import { isModelRetiredError } from './ai-provider-clients';

describe('task routing table (§8 per-task routing)', () => {
  it('covers all ten task keys (paths + compiler pipeline stages)', () => {
    expect([...COURSE_TASK_KEYS].sort()).toEqual(
      [
        'roadmap_titles',
        'module_concept_titles',
        'concept_outline',
        'concept_draft',
        'concept_factcheck',
        'concept_critique',
        'concept_style',
        'module_mcqs',
        'single_concept_mcqs',
        'qa_answer',
      ].sort(),
    );
  });

  it('sends title lists and extraction to fast, drafts and judgment to strong', () => {
    for (const key of [
      'roadmap_titles',
      'module_concept_titles',
      'module_mcqs',
      'single_concept_mcqs',
      'qa_answer',
    ] as const) {
      expect(taskRouteFor(key).tier).toBe('fast');
    }
    for (const key of [
      'concept_outline',
      'concept_draft',
      'concept_factcheck',
      'concept_critique',
      'concept_style',
    ] as const) {
      expect(taskRouteFor(key).tier).toBe('strong');
    }
  });

  it('every task key resolves to a known model through live machinery', () => {
    // No hardcodes: fast honors NVIDIA_MODEL_ID via configuredDefaultModel,
    // strong honors NVIDIA_STRONG_MODEL_ID, both fall back to the default.
    const globalDefault = (p: AiProvider) =>
      p === AiProvider.GEMINI ? 'gemini-2.0-flash' : 'meta/llama-3.1-70b-instruct';
    for (const key of COURSE_TASK_KEYS) {
      const plain = resolveTierModel(
        AiProvider.NVIDIA,
        TASK_ROUTES[key].tier,
        () => undefined,
        globalDefault,
      );
      expect(plain).toBe('meta/llama-3.1-70b-instruct');
    }
    const strong = resolveTierModel(
      AiProvider.NVIDIA,
      'strong',
      (k) => (k === 'NVIDIA_STRONG_MODEL_ID' ? 'operator-strong' : undefined),
      globalDefault,
    );
    expect(strong).toBe('operator-strong');
    const fastIgnoresStrongEnv = resolveTierModel(
      AiProvider.NVIDIA,
      'fast',
      (k) => (k === 'NVIDIA_STRONG_MODEL_ID' ? 'operator-strong' : undefined),
      globalDefault,
    );
    expect(fastIgnoresStrongEnv).toBe('meta/llama-3.1-70b-instruct');
  });

  it('isCourseTaskKey rejects unknown keys', () => {
    expect(isCourseTaskKey('concept_draft')).toBe(true);
    expect(isCourseTaskKey('nope')).toBe(false);
    expect(isCourseTaskKey(undefined)).toBe(false);
  });
});

describe('isModelRetiredError', () => {
  const retired = () =>
    new HttpException(
      {
        statusCode: HttpStatus.BAD_GATEWAY,
        message: 'Model "x" is not available (likely retired).',
        error: 'Bad Gateway',
        code: 'MODEL_RETIRED',
      },
      HttpStatus.BAD_GATEWAY,
    );

  it('matches the retired-model marker', () => {
    expect(isModelRetiredError(retired())).toBe(true);
  });

  it('rejects generic provider failures without the marker', () => {
    expect(
      isModelRetiredError(
        new HttpException(
          { statusCode: 502, message: 'down', error: 'Bad Gateway' },
          502,
        ),
      ),
    ).toBe(false);
    expect(isModelRetiredError(new Error('boom'))).toBe(false);
    expect(isModelRetiredError(null)).toBe(false);
  });
});
