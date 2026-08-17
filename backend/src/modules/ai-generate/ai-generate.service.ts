import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import type { Response } from 'express';
import { AiGenerationLog } from './entities/ai-generation-log.entity';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';

const DAILY_LIMIT = 20;

@Injectable()
export class AiGenerateService {
  private readonly logger = new Logger(AiGenerateService.name);

  constructor(
    @InjectRepository(AiGenerationLog)
    private readonly aiGenerationLogRepository: Repository<AiGenerationLog>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Check if the user has reached their 20 generation daily limit (UTC calendar day)
   */
  async checkRateLimit(userId: string): Promise<{ remaining: number }> {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const count = await this.aiGenerationLogRepository.count({
      where: {
        userId,
        generatedAt: MoreThanOrEqual(startOfDay),
      },
    });

    if (count >= DAILY_LIMIT) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Daily AI generation limit reached (${DAILY_LIMIT} generations per day). Please try again tomorrow (UTC).`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return { remaining: DAILY_LIMIT - count };
  }

  /**
   * Record a generation event in the log
   */
  async logGeneration(
    userId: string,
    type: AiGenerationType,
  ): Promise<AiGenerationLog> {
    const log = this.aiGenerationLogRepository.create({
      userId,
      generationType: type,
      generatedAt: new Date(),
    });
    return this.aiGenerationLogRepository.save(log);
  }

  /**
   * Proxies streaming completion request to NVIDIA NIM API and pipes SSE chunks to client response
   */
  async streamNvidiaCompletion(
    systemPrompt: string,
    userPrompt: string,
    res: Response,
    options?: { maxTokens?: number; temperature?: number },
    signal?: AbortSignal,
  ): Promise<void> {
    const apiKey = this.configService.get<string>('NVIDIA_API_KEY')?.trim();
    const apiUrl =
      this.configService.get<string>('NVIDIA_API_URL')?.trim() ||
      'https://integrate.api.nvidia.com/v1/chat/completions';
    const modelId =
      this.configService.get<string>('NVIDIA_MODEL_ID')?.trim() ||
      'meta/llama-3.1-70b-instruct';

    if (!apiKey) {
      throw new InternalServerErrorException(
        'NVIDIA API key (NVIDIA_API_KEY) is not configured on the server.',
      );
    }

    const maxTokens = options?.maxTokens ?? 2048;
    const temperature = options?.temperature ?? 0.6;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    let nvidiaRes: globalThis.Response;

    try {
      nvidiaRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: true,
          temperature,
          top_p: 0.9,
          max_tokens: maxTokens,
        }),
        signal,
      });
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`Failed to connect to NVIDIA NIM API: ${error.message}`);
      if (!res.headersSent) {
        throw new HttpException(
          `Unable to reach NVIDIA NIM API: ${error.message}`,
          HttpStatus.BAD_GATEWAY,
        );
      }
      res.write(
        `data: ${JSON.stringify({ error: `Connection failed: ${error.message}` })}\n\n`,
      );
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    if (!nvidiaRes.ok) {
      const errorBody = await nvidiaRes.text();
      this.logger.error(
        `NVIDIA NIM API returned error HTTP ${nvidiaRes.status}: ${errorBody}`,
      );
      res.write(
        `data: ${JSON.stringify({ error: `NVIDIA API Error (${nvidiaRes.status}): ${errorBody}` })}\n\n`,
      );
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    if (!nvidiaRes.body) {
      res.write(
        `data: ${JSON.stringify({ error: 'Empty response body from NVIDIA API' })}\n\n`,
      );
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const reader = nvidiaRes.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed === 'data: [DONE]') {
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }

          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent) {
                res.write(
                  `data: ${JSON.stringify({ content: deltaContent })}\n\n`,
                );
              }
            } catch {
              // Non-JSON line, continue buffering
            }
          }
        }
      }

      // Process any remaining tail in buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed === 'data: [DONE]') {
          res.write('data: [DONE]\n\n');
        } else if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              res.write(
                `data: ${JSON.stringify({ content: deltaContent })}\n\n`,
              );
            }
          } catch {
            // ignore malformed tail
          }
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.warn(`Stream reading error or client abort: ${error.message}`);
      try {
        res.write('data: [DONE]\n\n');
        res.end();
      } catch {
        // response may already be closed
      }
    }
  }
}
