import { ConfigService } from '@nestjs/config';
import { AiProviderClients } from './ai-provider-clients';

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
