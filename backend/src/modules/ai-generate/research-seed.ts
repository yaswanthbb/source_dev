/* eslint-disable no-console */
/**
 * Operator-run research seed: `npm run research:seed [-- --roadmap=<uuid>]`.
 * Fetches the tiny OER seed source live (MDN Closures, CC-BY-SA) and ingests
 * it into the corpus. Requires DATABASE_URL and NVIDIA_API_KEY. Safe to
 * re-run: unchanged URLs skip embedding entirely.
 *
 * Env is loaded explicitly here (with presence-only diagnostics) so a broken
 * .env edit fails fast naming the variable instead of surfacing later as a
 * confusing provider error. Values are never printed.
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from '../../config/typeorm.config';
import { CourseSource } from './entities/course-source.entity';
import { CourseSourceChunk } from './entities/course-source-chunk.entity';
import { AiProviderClients } from './ai-provider-clients';
import { CourseResearchService } from './course-research.service';

const REQUIRED_ENV = ['NVIDIA_API_KEY'] as const;

/**
 * Lenient fallback for one variable: dotenv skips lines it can't parse
 * (spaces around `=`, `export` quirks, stray quotes), while the value is
 * visibly present. Only fills process.env when it lacks the key — dotenv's
 * own parse always wins. DB connectivity is intentionally NOT required
 * here: getTypeOrmConfig falls back to DB_HOST/DB_* (local defaults) when
 * DATABASE_URL is commented out, exactly like the app.
 */
function ensureVarFromFiles(name: string, files: string[]): void {
  if ((process.env[name] ?? '').trim().length > 0) return;
  const pattern = new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=\\s*(.*?)\\s*$`);
  for (const file of files) {
    let body: string;
    try {
      body = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const line of body.split('\n')) {
      const match = pattern.exec(line.replace(/\r$/, ''));
      if (!match) continue;
      let value = match[1].trim();
      if (
        value.length >= 2 &&
        ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'")))
      ) {
        value = value.slice(1, -1);
      }
      if (value.length > 0) {
        process.env[name] = value;
        console.log(`env: ${name} recovered via lenient parse of ${file}`);
        return;
      }
    }
  }
}

function loadEnv(): void {
  // Mirror the app convention: backend/.env may be a one-line pointer
  // (ENV_FILE_PATH) at the real secrets file — follow it like
  // typeorm.config.ts does. dotenv never overrides already-set vars, so a
  // shell export still wins (useful for one-off overrides).
  const envPath = path.resolve(process.cwd(), '.env');
  const first = dotenv.config({ path: envPath });
  console.log(
    `env: loaded ${Object.keys(first.parsed ?? {}).length} var(s) from ${envPath}`,
  );
  if (first.error) {
    console.log(`env: dotenv note: ${first.error.message}`);
  }
  const pointer = (process.env.ENV_FILE_PATH ?? '').trim();
  if (pointer) {
    const second = dotenv.config({ path: pointer });
    console.log(
      `env: followed ENV_FILE_PATH → loaded ${Object.keys(second.parsed ?? {}).length} var(s) from ${pointer}`,
    );
    if (second.error) {
      console.log(`env: dotenv note: ${second.error.message}`);
    }
  }
  const candidates = pointer ? [pointer, envPath] : [envPath];
  for (const name of REQUIRED_ENV) {
    ensureVarFromFiles(name, candidates);
  }
  let missing = false;
  for (const name of REQUIRED_ENV) {
    const present = (process.env[name] ?? '').trim().length > 0;
    console.log(`env: ${name} ${present ? 'set' : 'MISSING/EMPTY'}`);
    if (!present) missing = true;
  }
  if (missing) {
    console.error(
      'research:seed failed: required env above is missing/empty — fix backend/.env (check for duplicate keys: the last occurrence wins).',
    );
    process.exit(2);
  }
}

async function main(): Promise<void> {
  loadEnv();
  const roadmapArg = process.argv.find((a) => a.startsWith('--roadmap='));
  const roadmapId = roadmapArg ? roadmapArg.split('=')[1] : null;

  const dataSource = new DataSource(getTypeOrmConfig() as any);
  await dataSource.initialize();
  try {
    // process.env-backed config (no ConfigModule here): deterministic reads.
    const configService = {
      get: (key: string) => process.env[key],
    } as ConfigService;
    const service = new CourseResearchService(
      dataSource.getRepository(CourseSource),
      dataSource.getRepository(CourseSourceChunk),
      new AiProviderClients(configService),
      configService,
    );
    const result = await service.ensureSeedSource(roadmapId);
    console.log(
      result.skipped
        ? `Seed unchanged — skipped (${result.chunks} chunk(s) stored).`
        : `Seed ingested: ${result.chunks} chunk(s) from ${result.source.url}.`,
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err: unknown) => {
  console.error(
    'research:seed failed:',
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
});
