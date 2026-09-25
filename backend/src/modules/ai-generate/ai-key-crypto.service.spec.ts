import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiKeyCryptoService } from './ai-key-crypto.service';

describe('AiKeyCryptoService', () => {
  const secret = 'ab'.repeat(32); // 32 bytes hex

  async function build(env: Record<string, string | undefined>) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiKeyCryptoService,
        { provide: ConfigService, useValue: { get: (k: string) => env[k] } },
      ],
    }).compile();
    const service = module.get(AiKeyCryptoService);
    await service.onModuleInit();
    return service;
  }

  it('round-trips encrypt/decrypt with distinct ciphertexts', async () => {
    const service = await build({
      AI_KEYS_ENCRYPTION_SECRET: secret,
      NODE_ENV: 'test',
    });

    const a = service.encrypt('nvapi-secret-1');
    const b = service.encrypt('nvapi-secret-1');

    expect(a).not.toBe(b); // random IV
    expect(service.decrypt(a)).toBe('nvapi-secret-1');
    expect(service.decrypt(b)).toBe('nvapi-secret-1');
  });

  it('rejects a malformed envelope', async () => {
    const service = await build({
      AI_KEYS_ENCRYPTION_SECRET: secret,
      NODE_ENV: 'test',
    });

    expect(() => service.decrypt('garbage')).toThrow();
  });

  it('refuses a wrong-length secret', async () => {
    await expect(
      build({ AI_KEYS_ENCRYPTION_SECRET: 'short', NODE_ENV: 'test' }),
    ).rejects.toThrow('32 bytes');
  });

  it('refuses to boot production without a secret', async () => {
    await expect(
      build({ NODE_ENV: 'production' }),
    ).rejects.toThrow('required in production');
  });
});
