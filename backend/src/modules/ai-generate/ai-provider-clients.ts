import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider } from '../../common/enums/ai-provider.enum';
import { lintLeakage } from './compiler-stages';

export interface CompletionOptions {
  /** Eval-only reproducibility hint; omitted by every existing generation call. */
  seed?: number;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: { type: 'json_object' | 'text' };
}

export interface CompletionResult {
  text: string;
  tokensIn: number | null;
  tokensOut: number | null;
}

function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export interface ProviderMeta {
  provider: AiProvider;
  displayName: string;
  /** Whether the provider requires a caller-owned key. */
  byokOnly: boolean;
  defaultModel: string;
}

const NVIDIA_DEFAULT_MODEL = 'meta/llama-3.1-70b-instruct';
const GEMINI_DEFAULT_MODEL = 'gemini-3.6-flash';
export const DEFAULT_PLATFORM_PROVIDER = AiProvider.GEMINI;
const NVIDIA_DEFAULT_EMBEDDING_MODEL = 'nvidia/nemotron-3-embed-1b';

const CURATED_MODELS: Record<AiProvider, string[]> = {
  [AiProvider.NVIDIA]: [
    'meta/llama-3.1-70b-instruct',
    'meta/llama-3.1-405b-instruct',
    'nvidia/llama-3.1-nemotron-70b-instruct',
  ],
  [AiProvider.GEMINI]: [GEMINI_DEFAULT_MODEL],
};

export const PROVIDER_METAS: ProviderMeta[] = [
  {
    provider: AiProvider.GEMINI,
    displayName: 'Google Gemini',
    byokOnly: false,
    defaultModel: GEMINI_DEFAULT_MODEL,
  },
  {
    provider: AiProvider.NVIDIA,
    displayName: 'NVIDIA NIM',
    byokOnly: false,
    defaultModel: NVIDIA_DEFAULT_MODEL,
  },
];

export function defaultModelFor(provider: AiProvider): string {
  return provider === AiProvider.GEMINI
    ? GEMINI_DEFAULT_MODEL
    : NVIDIA_DEFAULT_MODEL;
}

/**
 * §8 research embeddings run on NVIDIA (OpenAI-compatible embeddings API).
 * Model is env-overridable; the curated default lives here with the other
 * provider defaults — no model literals in routing or service code.
 */
export function defaultEmbeddingModel(provider: AiProvider): string {
  if (provider !== AiProvider.NVIDIA) {
    throw providerFailure(provider, 'embeddings run on NVIDIA only');
  }
  return NVIDIA_DEFAULT_EMBEDDING_MODEL;
}

export function curatedModelsFor(provider: AiProvider): string[] {
  return [...CURATED_MODELS[provider]];
}

/** Shared wait-or-switch prompt for traffic/provider failures (§5). */
export function providerFailure(
  provider: AiProvider,
  detail: string,
  status: number = HttpStatus.BAD_GATEWAY,
): HttpException {
  const name = provider === AiProvider.GEMINI ? 'Google Gemini' : 'NVIDIA NIM';
  return new HttpException(
    {
      statusCode: status,
      message: `AI provider ${name} is unavailable right now (${detail}). Please wait until tomorrow, or add/switch to your own key or another provider in API key settings.`,
      error: status === 429 ? 'Too Many Requests' : 'Bad Gateway',
    },
    status,
  );
}

export function invalidKeyError(provider: AiProvider): HttpException {
  const name = provider === AiProvider.GEMINI ? 'Google Gemini' : 'NVIDIA NIM';
  return new HttpException(
    {
      statusCode: HttpStatus.BAD_REQUEST,
      message: `The ${name} API key was rejected. Check the key or replace it with a valid one.`,
      error: 'Bad Request',
    },
    HttpStatus.BAD_REQUEST,
  );
}

function isAuthFailure(status: number): boolean {
  return status === 401 || status === 403;
}

/**
 * Fallback-chain predicate: true when a completion failed because the model
 * id is retired/gone (404/410 from either provider). Detected via the
 * machine-readable `code` marker, not message text.
 */
export function isModelRetiredError(err: unknown): boolean {
  if (err instanceof HttpException) {
    const response = err.getResponse() as
      { code?: unknown } | string | null | undefined;
    return (
      typeof response === 'object' &&
      response !== null &&
      response.code === 'MODEL_RETIRED'
    );
  }
  return false;
}

@Injectable()
export class AiProviderClients {
  private readonly logger = new Logger(AiProviderClients.name);

  constructor(private readonly configService: ConfigService) {}

  /** Server model overrides remain provider-specific; both tiers share this default. */
  configuredDefaultModel(provider: AiProvider): string {
    return (
      this.configService
        .get<string>(`${provider.toUpperCase()}_MODEL_ID`)
        ?.trim() || defaultModelFor(provider)
    );
  }

  async complete(
    provider: AiProvider,
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    options?: CompletionOptions,
    signal?: AbortSignal,
  ): Promise<CompletionResult> {
    return provider === AiProvider.GEMINI
      ? this.geminiCompletion(
          apiKey,
          model,
          systemPrompt,
          userPrompt,
          options,
          signal,
        )
      : this.nvidiaCompletion(
          apiKey,
          model,
          systemPrompt,
          userPrompt,
          options,
          signal,
        );
  }

  /**
   * Embedding model: NVIDIA_EMBEDDING_MODEL_ID when set, else the curated
   * default. Mirrors configuredDefaultModel for the research path.
   */
  configuredEmbeddingModel(): string {
    return (
      this.configService.get<string>('NVIDIA_EMBEDDING_MODEL_ID')?.trim() ||
      NVIDIA_DEFAULT_EMBEDDING_MODEL
    );
  }

  /**
   * §8 research embeddings (NVIDIA OpenAI-compatible API). One call embeds
   * a batch of texts; returns vectors in input order. Never billed to user
   * quota — ingestion and research are operator/compile-time work.
   */
  async embed(
    apiKey: string,
    model: string,
    inputs: string[],
  ): Promise<number[][]> {
    if (inputs.length === 0) return [];
    const apiUrl =
      this.configService.get<string>('NVIDIA_EMBEDDINGS_API_URL')?.trim() ||
      'https://integrate.api.nvidia.com/v1/embeddings';
    let response: globalThis.Response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, input: inputs }),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to reach NVIDIA embeddings API: ${msg}`);
      throw providerFailure(AiProvider.NVIDIA, msg);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `NVIDIA embeddings API error HTTP ${response.status}: ${errorBody}`,
      );
      if (isAuthFailure(response.status)) {
        throw invalidKeyError(AiProvider.NVIDIA);
      }
      if (response.status === 429) {
        throw providerFailure(AiProvider.NVIDIA, 'rate limited', 429);
      }
      if (response.status === 404 || response.status === 410) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_GATEWAY,
            message: `Embedding model "${model}" is not available on NVIDIA NIM (HTTP ${response.status} — likely retired).`,
            error: 'Bad Gateway',
            code: 'MODEL_RETIRED',
          },
          HttpStatus.BAD_GATEWAY,
        );
      }
      throw providerFailure(AiProvider.NVIDIA, `HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ embedding?: unknown; index?: unknown }>;
    };
    const rows = [...(data.data ?? [])].sort(
      (a, b) => Number(a.index ?? 0) - Number(b.index ?? 0),
    );
    if (rows.length !== inputs.length) {
      throw providerFailure(
        AiProvider.NVIDIA,
        `embedding count mismatch (got ${rows.length} for ${inputs.length})`,
      );
    }
    return rows.map((row) => {
      if (
        !Array.isArray(row.embedding) ||
        !row.embedding.every((v) => typeof v === 'number')
      ) {
        throw providerFailure(AiProvider.NVIDIA, 'malformed embedding vector');
      }
      return row.embedding as number[];
    });
  }

  private async nvidiaCompletion(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    options?: CompletionOptions,
    signal?: AbortSignal,
  ): Promise<CompletionResult> {
    const apiUrl =
      this.configService.get<string>('NVIDIA_API_URL')?.trim() ||
      'https://integrate.api.nvidia.com/v1/chat/completions';
    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      temperature: options?.temperature ?? 0.6,
      top_p: 0.9,
      max_tokens: options?.maxTokens ?? 2048,
    };
    if (options?.responseFormat) {
      body.response_format = options.responseFormat;
    }
    if (options?.seed !== undefined) body.seed = options.seed;

    // Removing response_format is the only retry here: same model, key,
    // prompts, token budget and signal. Once removed, neither path can retry.
    for (;;) {
      let response: globalThis.Response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const cause = (err as { cause?: { code?: string } })?.cause?.code;
        this.logger.error(
          `Failed to reach NVIDIA NIM API (model="${model}"): ${msg}${cause ? ` (cause: ${cause})` : ''}`,
        );
        throw providerFailure(AiProvider.NVIDIA, msg);
      }

      if (!response.ok) {
        const errorBody = await response.text();
        // Do not retry auth, rate limits, retired models, transport failures
        // or unrelated validation errors as response-format incompatibility.
        if (
          body.response_format &&
          (response.status === 400 || response.status === 422) &&
          /response[_\s-]?format|json_object/i.test(errorBody)
        ) {
          this.logger.warn(
            `NVIDIA NIM model="${model}" rejected response_format (HTTP ${response.status}); retrying once without response_format.`,
          );
          delete body.response_format;
          continue;
        }
        this.logger.error(
          `NVIDIA NIM API error (model="${model}") HTTP ${response.status}: ${errorBody}`,
        );
        if (isAuthFailure(response.status)) {
          throw invalidKeyError(AiProvider.NVIDIA);
        }
        if (response.status === 429) {
          throw providerFailure(AiProvider.NVIDIA, 'rate limited', 429);
        }
        if (response.status === 404 || response.status === 410) {
          throw new HttpException(
            {
              statusCode: HttpStatus.BAD_GATEWAY,
              message: `Model "${model}" is not available on NVIDIA NIM (HTTP ${response.status} — likely retired). Pick another model from the live model list.`,
              error: 'Bad Gateway',
              code: 'MODEL_RETIRED',
            },
            HttpStatus.BAD_GATEWAY,
          );
        }
        throw providerFailure(
          AiProvider.NVIDIA,
          `HTTP ${response.status}`,
          response.status >= 500 ? HttpStatus.BAD_GATEWAY : response.status,
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{
          finish_reason?: unknown;
          message?: { content?: unknown; reasoning_content?: unknown };
        }>;
        usage?: {
          prompt_tokens?: unknown;
          completion_tokens?: unknown;
          completion_tokens_details?: { reasoning_tokens?: unknown };
        };
      };
      const choice = data.choices?.[0];
      const message = choice?.message;
      let text =
        typeof message?.content === 'string' ? message.content.trim() : '';
      if (!text) {
        // Shape-only diagnostics: never log prompts, generated reasoning or keys.
        this.logger.warn(
          `NVIDIA NIM empty content: ${JSON.stringify({
            model,
            response_format: body.response_format ?? null,
            choiceKeys: Object.keys(choice ?? {}),
            messageKeys: Object.keys(message ?? {}),
            finish_reason: choice?.finish_reason ?? null,
            reasoningChars:
              typeof message?.reasoning_content === 'string'
                ? message.reasoning_content.length
                : 0,
            completionTokens: numOrNull(data.usage?.completion_tokens),
            reasoningTokens: numOrNull(
              data.usage?.completion_tokens_details?.reasoning_tokens,
            ),
          })}`,
        );
        text = this.nvidiaReasoningText(
          message?.reasoning_content,
          options?.responseFormat?.type === 'json_object',
          choice?.finish_reason,
        );
        if (text) {
          this.logger.warn(
            `NVIDIA NIM model="${model}" recovered final output from reasoning_content.`,
          );
        } else if (body.response_format) {
          // Some compatible endpoints silently return 200 + empty content for
          // unsupported JSON mode. Try once without it; callers still validate.
          this.logger.warn(
            `NVIDIA NIM model="${model}" returned no usable output; retrying once without response_format.`,
          );
          delete body.response_format;
          continue;
        } else {
          throw providerFailure(
            AiProvider.NVIDIA,
            `empty response from model "${model}"${choice?.finish_reason === 'length' ? '; output token limit reached before a final answer' : ''}`,
          );
        }
      }
      return {
        text,
        tokensIn: numOrNull(data.usage?.prompt_tokens),
        tokensOut: numOrNull(data.usage?.completion_tokens),
      };
    }
  }

  /**
   * Compatibility recovery only, not a routing policy for thinking models.
   * Never promote a truncated thought trace. JSON work needs a whole object;
   * prose needs an explicit end-of-thinking boundary. Reuse the compiler's
   * leakage lint before accepting either form, rather than new planning rules.
   */
  private nvidiaReasoningText(
    raw: unknown,
    jsonObject: boolean,
    finishReason: unknown,
  ): string {
    if (typeof raw !== 'string' || finishReason === 'length') return '';
    const hasAnswerBoundary = /<\/(?:think|thinking|analysis)\s*>/i.test(raw);
    const text = raw
      .replace(/<(think|thinking|analysis)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/^[\s\S]*<\/(?:think|thinking|analysis)\s*>/i, '')
      .replace(/<(?:think|thinking|analysis)\b[^>]*>[\s\S]*$/gi, '')
      .trim()
      .replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i, '$1')
      .trim();
    if (!text || lintLeakage(text).leaked) return '';
    try {
      const parsed: unknown = JSON.parse(text);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        (!jsonObject || !Array.isArray(parsed))
      ) {
        return text;
      }
    } catch {
      // Free text is accepted only after an explicit final-answer boundary.
    }
    return !jsonObject && hasAnswerBoundary ? text : '';
  }

  private async geminiCompletion(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    options?: CompletionOptions,
    signal?: AbortSignal,
  ): Promise<CompletionResult> {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent` +
      `?key=${encodeURIComponent(apiKey)}`;
    const jsonOutput = options?.responseFormat?.type === 'json_object';
    // Google documents Gemini 3.6 Flash as a thinking model: thinking cannot
    // be disabled. MINIMAL is its lowest supported level, not a zero budget.
    // Keep reasoning separate from schema-bound output and never return thought parts.
    const structuredThinking = jsonOutput && model === GEMINI_DEFAULT_MODEL;
    if (structuredThinking) {
      this.logger.log(
        `Gemini JSON request model="${model}": thinkingLevel=MINIMAL (thinking cannot be fully disabled), includeThoughts=false.`,
      );
    }
    const body: Record<string, unknown> = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        ...(options?.seed !== undefined ? { seed: options.seed } : {}),
        temperature: options?.temperature ?? 0.6,
        maxOutputTokens: options?.maxTokens ?? 2048,
        responseMimeType: jsonOutput ? 'application/json' : 'text/plain',
        ...(structuredThinking
          ? {
              thinkingConfig: {
                thinkingLevel: 'MINIMAL',
                includeThoughts: false,
              },
            }
          : {}),
      },
    };

    let response: globalThis.Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const cause = (err as { cause?: { code?: string } })?.cause?.code;
      this.logger.error(
        `Failed to reach Gemini API: ${msg}${cause ? ` (cause: ${cause})` : ''}`,
      );
      throw providerFailure(AiProvider.GEMINI, msg);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `Gemini API error HTTP ${response.status}: ${errorBody}`,
      );
      if (isAuthFailure(response.status)) {
        throw invalidKeyError(AiProvider.GEMINI);
      }
      if (response.status === 429) {
        throw providerFailure(AiProvider.GEMINI, 'rate limited', 429);
      }
      if (response.status === 404) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_GATEWAY,
            message: `Model "${model}" is not available on Google Gemini (HTTP 404 — likely retired or misspelled). Pick another model from the live model list.`,
            error: 'Bad Gateway',
            code: 'MODEL_RETIRED',
          },
          HttpStatus.BAD_GATEWAY,
        );
      }
      throw providerFailure(
        AiProvider.GEMINI,
        `HTTP ${response.status}`,
        response.status >= 500 ? HttpStatus.BAD_GATEWAY : response.status,
      );
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string; thought?: boolean }> };
      }>;
      usageMetadata?: {
        promptTokenCount?: unknown;
        candidatesTokenCount?: unknown;
      };
    };
    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .filter((p) => p.thought !== true)
      .map((p) => p.text ?? '')
      .join('')
      .trim();
    if (!text) {
      throw providerFailure(AiProvider.GEMINI, 'empty response');
    }
    return {
      text,
      tokensIn: numOrNull(data.usageMetadata?.promptTokenCount),
      tokensOut: numOrNull(data.usageMetadata?.candidatesTokenCount),
    };
  }

  /**
   * Live model list (LibreChat-style fetch). Falls back to curated defaults
   * with live:false when the provider is unreachable or no key is available
   * (e.g. a provider without its platform key or a caller key).
   */
  async listModels(
    provider: AiProvider,
    apiKey?: string,
  ): Promise<{ models: string[]; live: boolean }> {
    try {
      if (provider === AiProvider.NVIDIA && apiKey) {
        const response = await fetch(
          'https://integrate.api.nvidia.com/v1/models',
          { headers: { Authorization: `Bearer ${apiKey}` } },
        );
        if (!response.ok) {
          if (isAuthFailure(response.status)) {
            throw invalidKeyError(provider);
          }
          throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as {
          data?: Array<{ id?: string }>;
        };
        const models = (data.data ?? []).map((m) => m.id ?? '').filter(Boolean);
        if (models.length > 0) return { models, live: true };
      }

      if (provider === AiProvider.GEMINI && apiKey) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
        );
        if (!response.ok) {
          if (isAuthFailure(response.status)) {
            throw invalidKeyError(provider);
          }
          throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as {
          models?: Array<{
            name?: string;
            supportedGenerationMethods?: string[];
          }>;
        };
        const models = (data.models ?? [])
          .filter((m) =>
            m.supportedGenerationMethods?.includes('generateContent'),
          )
          .map((m) => (m.name ?? '').replace(/^models\//, ''))
          .filter(Boolean);
        if (models.length > 0) return { models, live: true };
      }
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Live model list failed for ${provider}: ${msg}`);
    }
    return { models: curatedModelsFor(provider), live: false };
  }
}
