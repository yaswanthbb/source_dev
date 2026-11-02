import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AiProvider } from '../../common/enums/ai-provider.enum';
import { resolveTierModel, taskRouteFor } from './task-routing';
import { AiProviderClients, isModelRetiredError } from './ai-provider-clients';

function clientsWith(
  env: Record<string, string | undefined>,
): AiProviderClients {
  return new AiProviderClients({
    get: (key: string) => env[key],
  } as unknown as ConfigService);
}

describe('embedding model resolution (§8 RAG ops)', () => {
  it("defaults to exactly 'nvidia/nemotron-3-embed-1b' (verified live 2026-10-06)", () => {
    expect(clientsWith({}).configuredEmbeddingModel()).toBe(
      'nvidia/nemotron-3-embed-1b',
    );
  });

  it('NVIDIA_EMBEDDING_MODEL_ID override still wins', () => {
    expect(
      clientsWith({
        NVIDIA_EMBEDDING_MODEL_ID: 'nvidia/some-future-embed-1b',
      }).configuredEmbeddingModel(),
    ).toBe('nvidia/some-future-embed-1b');
  });
});

describe('NVIDIA completion compatibility', () => {
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  let warn: jest.SpyInstance;
  const jsonOptions = { responseFormat: { type: 'json_object' as const } };
  const model = 'configured-instruct';
  const client = () => clientsWith({});
  const complete = () =>
    client().complete(
      AiProvider.NVIDIA,
      'test-key',
      model,
      'system',
      'user',
      jsonOptions,
    );
  const payload = (message: Record<string, unknown>, finishReason = 'stop') =>
    new Response(
      JSON.stringify({
        choices: [{ index: 0, message, finish_reason: finishReason }],
        usage: {
          prompt_tokens: 12,
          completion_tokens: 34,
          completion_tokens_details: { reasoning_tokens: 30 },
        },
      }),
    );
  const requestBody = (index: number): Record<string, unknown> =>
    JSON.parse(fetchMock.mock.calls[index][1]!.body as string) as Record<
      string,
      unknown
    >;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
    warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it.each<[Record<string, string>, string]>([
    [{}, 'meta/llama-3.1-70b-instruct'],
    [
      { NVIDIA_MODEL_ID: ' nvidia/nemotron-3.5-lightning-30b-a3b ' },
      'nvidia/nemotron-3.5-lightning-30b-a3b',
    ],
    [
      { NVIDIA_MODEL_ID: 'base', NVIDIA_STRONG_MODEL_ID: ' strong-instruct ' },
      'strong-instruct',
    ],
    [{ NVIDIA_MODEL_ID: 'base', NVIDIA_STRONG_MODEL_ID: '  ' }, 'base'],
  ])(
    'sends the resolved strong-tier outline model: %j',
    async (env, expected) => {
      const clients = clientsWith(env);
      const route = taskRouteFor('concept_outline');
      const resolved = resolveTierModel(
        AiProvider.NVIDIA,
        route.tier,
        (key) => env[key],
        (provider) => clients.configuredDefaultModel(provider),
      );
      fetchMock.mockResolvedValue(payload({ content: '{"title":"Branches"}' }));
      await clients.complete(
        AiProvider.NVIDIA,
        'test-key',
        resolved,
        'system',
        'user',
        { ...route, ...jsonOptions },
      );
      expect(requestBody(0)).toMatchObject({
        model: expected,
        max_tokens: 800,
        response_format: { type: 'json_object' },
        stream: false,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it('prefers normal content over reasoning and preserves usage', async () => {
    fetchMock.mockResolvedValue(
      payload({
        content: '  {"answer":1}  ',
        reasoning_content: 'private thoughts',
      }),
    );
    await expect(complete()).resolves.toEqual({
      text: '{"answer":1}',
      tokensIn: 12,
      tokensOut: 34,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    '{"answer":1}',
    '<think>private deliberation</think>\n{"answer":1}',
    'private deliberation</think>\n```json\n{"answer":1}\n```',
    '<analysis>private deliberation</analysis>\n{"answer":1}',
  ])(
    'recovers a whole final JSON object from reasoning_content: %s',
    async (reasoning) => {
      fetchMock.mockResolvedValue(
        payload({ content: null, reasoning_content: reasoning }),
      );
      await expect(complete()).resolves.toEqual({
        text: '{"answer":1}',
        tokensIn: 12,
        tokensOut: 34,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(`model="${model}" recovered final output`),
      );
    },
  );

  it('recovers prose after an explicit thinking boundary for text requests', async () => {
    fetchMock.mockResolvedValue(
      payload({
        content: ' ',
        reasoning_content: '<think>private deliberation</think>Final article.',
      }),
    );
    await expect(
      client().complete(AiProvider.NVIDIA, 'test-key', model, 'system', 'user'),
    ).resolves.toMatchObject({ text: 'Final article.' });
  });

  it.each([
    ['I need to plan the article.', 'stop'],
    ['Unmarked private deliberation.', 'stop'],
    ['<think>unfinished thoughts', 'stop'],
    ['<think>private thoughts only</think>', 'stop'],
    ['{"answer":"thinking process"}', 'stop'],
    ['{"answer":1}', 'length'],
    ['<think>private thoughts</think>{"answer":', 'stop'],
    ['["array"]', 'stop'],
  ])(
    'rejects unusable/truncated reasoning: %s (%s)',
    async (reasoning, finishReason) => {
      fetchMock.mockImplementation(() =>
        Promise.resolve(
          payload(
            { content: null, reasoning_content: reasoning },
            finishReason,
          ),
        ),
      );
      await expect(complete()).rejects.toThrow('empty response');
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(requestBody(1)).not.toHaveProperty('response_format');
      expect(warn).not.toHaveBeenCalledWith(
        expect.stringContaining('recovered final output'),
      );
    },
  );

  it('never promotes unmarked reasoning prose for a text request', async () => {
    fetchMock.mockResolvedValue(
      payload({ reasoning_content: 'Unmarked private deliberation.' }),
    );
    await expect(
      client().complete(AiProvider.NVIDIA, 'test-key', model, 'system', 'user'),
    ).rejects.toThrow('empty response');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([400, 422])(
    'retries format rejection HTTP %s once, preserving other request fields',
    async (status) => {
      fetchMock
        .mockResolvedValueOnce(
          new Response(
            '{"error":{"message":"response_format json_object is not supported"}}',
            { status },
          ),
        )
        .mockResolvedValueOnce(payload({ content: '{"answer":1}' }));
      const options = {
        ...jsonOptions,
        seed: 42,
        maxTokens: 800,
        temperature: 0.5,
      };
      const signal = new AbortController().signal;
      await expect(
        clientsWith({
          NVIDIA_API_URL: 'https://nim.example.test/completions',
        }).complete(
          AiProvider.NVIDIA,
          'test-key',
          model,
          'system',
          'user',
          options,
          signal,
        ),
      ).resolves.toMatchObject({ text: '{"answer":1}' });
      const { response_format, ...originalBody } = requestBody(0);
      expect(response_format).toEqual(jsonOptions.responseFormat);
      expect(requestBody(1)).toEqual(originalBody);
      expect(options.responseFormat).toEqual({ type: 'json_object' });
      expect(fetchMock.mock.calls[1][0]).toBe(
        'https://nim.example.test/completions',
      );
      expect(fetchMock.mock.calls[1][1]).toMatchObject({
        signal,
        headers: { Authorization: 'Bearer test-key' },
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(`model="${model}" rejected response_format`),
      );
    },
  );

  it.each([null, '  ', 123, { unexpected: true }])(
    'retries silent HTTP 200 format failure with content %j',
    async (content) => {
      fetchMock
        .mockResolvedValueOnce(payload({ content }))
        .mockResolvedValueOnce(payload({ content: '{"answer":1}' }));
      await expect(complete()).resolves.toMatchObject({ text: '{"answer":1}' });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(requestBody(1)).not.toHaveProperty('response_format');
    },
  );

  it('logs response shape and token exhaustion without reasoning or credentials', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        payload(
          { content: null, reasoning_content: 'SENSITIVE_TRACE' },
          'length',
        ),
      ),
    );
    await expect(complete()).rejects.toThrow(
      'output token limit reached before a final answer',
    );
    const logs = warn.mock.calls
      .map((args: unknown[]) => String(args[0]))
      .join('\n');
    expect(logs).toContain(model);
    expect(logs).toContain('"choiceKeys":["index","message","finish_reason"]');
    expect(logs).toContain('"messageKeys":["content","reasoning_content"]');
    expect(logs).toContain('"finish_reason":"length"');
    expect(logs).toContain('"reasoningTokens":30');
    expect(logs).not.toMatch(/SENSITIVE_TRACE|test-key/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stops after a second format rejection', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response('response_format not supported', { status: 400 }),
      ),
    );
    await expect(complete()).rejects.toThrow('HTTP 400');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('handles missing choices/message with a bounded retry', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response('{}')));
    await expect(complete()).rejects.toThrow('empty response');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([401, 403, 429, 404, 410, 500, 400])(
    'does not retry unrelated HTTP %s failures',
    async (status) => {
      fetchMock.mockResolvedValue(
        new Response(
          status === 400
            ? 'invalid temperature'
            : 'response_format unavailable',
          { status },
        ),
      );
      await expect(complete()).rejects.toThrow();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each([404, 410])(
    'preserves the retired-model marker for HTTP %s',
    async (status) => {
      fetchMock.mockResolvedValue(new Response('retired', { status }));
      const err: unknown = await complete().catch((error: unknown) => error);
      expect(isModelRetiredError(err)).toBe(true);
    },
  );

  it.each(['network unavailable', 'The operation was aborted'])(
    'does not retry transport/abort errors: %s',
    async (message) => {
      fetchMock.mockRejectedValue(new Error(message));
      await expect(complete()).rejects.toThrow(message);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );
});
