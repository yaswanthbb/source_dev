import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

/**
 * §5 key custody (§5 security requirement): provider API keys are encrypted
 * with AES-256-GCM before storage and decrypted only server-side at call
 * time. Ciphertext layout: `v1:<ivHex>:<cipherHex>:<authTagHex>`.
 *
 * The 32-byte master secret comes from AI_KEYS_ENCRYPTION_SECRET (hex).
 * Production refuses to boot without it; non-production generates an
 * ephemeral secret (keys survive only until restart) with a loud warning.
 */
@Injectable()
export class AiKeyCryptoService implements OnModuleInit {
  private readonly logger = new Logger(AiKeyCryptoService.name);
  private masterKey!: Buffer;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const raw = this.configService
      .get<string>('AI_KEYS_ENCRYPTION_SECRET')
      ?.trim();
    const isProd =
      this.configService.get<string>('NODE_ENV') === 'production';

    if (raw) {
      const key = Buffer.from(raw, 'hex');
      if (key.length !== 32) {
        throw new Error(
          'AI_KEYS_ENCRYPTION_SECRET must be 32 bytes, hex-encoded (64 hex chars).',
        );
      }
      this.masterKey = key;
      return;
    }

    if (isProd) {
      throw new Error(
        'AI_KEYS_ENCRYPTION_SECRET is required in production. Refusing to boot without key custody.',
      );
    }
    this.masterKey = randomBytes(32);
    this.logger.warn(
      'AI_KEYS_ENCRYPTION_SECRET is not set — using an ephemeral key. Stored provider keys will NOT survive a restart. Set the secret for real use.',
    );
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);
    const cipherText = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString('hex')}:${cipherText.toString('hex')}:${tag.toString('hex')}`;
  }

  decrypt(envelope: string): string {
    const [version, ivHex, cipherHex, tagHex] = envelope.split(':');
    if (version !== 'v1' || !ivHex || !cipherHex || !tagHex) {
      throw new Error('Malformed encrypted key envelope.');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.masterKey,
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return (
      decipher.update(Buffer.from(cipherHex, 'hex')).toString('utf8') +
      decipher.final('utf8')
    );
  }
}
