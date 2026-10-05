import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider } from '../../common/enums/ai-provider.enum';

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  responseFormat?: { type: 'json_object' | 'text' };
}

export interface ProviderMeta {
  provider: AiProvider;
  displayName: string;
  /** Gemini has no platform key — usable only with the caller's own key. */
  byokOnly: boolean;
  defaultModel: string;
}

const NVIDIA_DEFAULT_MODEL = 'meta/llama-3.1-70b-instruct';
const GEMINI_DEFAULT_MODEL = 'gemini-3.6-flash';

const CURATED_MODELS: Record<AiProvider, string[]> = {
  [AiProvider.NVIDIA]: [
    'meta/llama-3.1-70b-instruct',
    'meta/llama-3.1-405b-instruct',
    'nvidia/llama-3.1-nemotron-70b-instruct',
  ],
  [AiProvider.GEMINI]: [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ],
};

export const PROVIDER_METAS: ProviderMeta[] = [
  {
    provider: AiProvider.NVIDIA,
    displayName: 'NVIDIA NIM',
    byokOnly: false,
    defaultModel: NVIDIA_DEFAULT_MODEL,
  },
  {
    provider: AiProvider.GEMINI,
    displayName: 'Google Gemini',
    byokOnly: true,
    defaultModel: GEMINI_DEFAULT_MODEL,
  },
];

export function defaultModelFor(provider: AiProvider): string {
  return provider === AiProvider.GEMINI
    ? GEMINI_DEFAULT_MODEL
    : NVIDIA_DEFAULT_MODEL;
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
      message: `AI provider ${name} is unavailable right now (${detail}). Please wait until tomorrow, or add/switch to your own key.`,
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

@Injectable()
export class AiProviderClients {
  private readonly logger = new Logger(AiProviderClients.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Server default model per provider. NVIDIA honors NVIDIA_MODEL_ID when
   * set (restores the pre-BYOK operator override); otherwise curated default.
   */
  configuredDefaultModel(provider: AiProvider): string {
    if (provider === AiProvider.NVIDIA) {
      const override = this.configService
        .get<string>('NVIDIA_MODEL_ID')
        ?.trim();
      if (override) return override;
    }
    return defaultModelFor(provider);
  }

  async complete(
    provider: AiProvider,
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    options?: CompletionOptions,
    signal?: AbortSignal,
  ): Promise<string> {
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

  private async nvidiaCompletion(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    options?: CompletionOptions,
    signal?: AbortSignal,
  ): Promise<string> {
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
        `Failed to reach NVIDIA NIM API: ${msg}${cause ? ` (cause: ${cause})` : ''}`,
      );
      throw providerFailure(AiProvider.NVIDIA, msg);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `NVIDIA NIM API error HTTP ${response.status}: ${errorBody}`,
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
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw providerFailure(AiProvider.NVIDIA, 'empty response');
    }
    return text;
  }

  private async geminiCompletion(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    options?: CompletionOptions,
    signal?: AbortSignal,
  ): Promise<string> {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent` +
      `?key=${encodeURIComponent(apiKey)}`;
    const body: Record<string, unknown> = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.6,
        maxOutputTokens: options?.maxTokens ?? 2048,
        responseMimeType:
          options?.responseFormat?.type === 'json_object'
            ? 'application/json'
            : 'text/plain',
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
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? '')
      .join('')
      .trim();
    if (!text) {
      throw providerFailure(AiProvider.GEMINI, 'empty response');
    }
    return text;
  }

  /**
   * Live model list (LibreChat-style fetch). Falls back to curated defaults
   * with live:false when the provider is unreachable or no key is available
   * (e.g. Gemini without a caller key).
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
