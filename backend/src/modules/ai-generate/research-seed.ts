/**
 * Operator-run research seed: `npm run research:seed [-- --roadmap=<uuid>]`.
 * Fetches the tiny OER seed source live (MDN Closures, CC-BY-SA) and ingests
 * it into the corpus. Requires DATABASE_URL and NVIDIA_API_KEY. Safe to
 * re-run: unchanged URLs skip embedding entirely.
 */
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from '../../config/typeorm.config';
import { CourseSource } from './entities/course-source.entity';
import { CourseSourceChunk } from './entities/course-source-chunk.entity';
import { AiProviderClients } from './ai-provider-clients';
import { CourseResearchService } from './course-research.service';

async function main(): Promise<void> {
  const roadmapArg = process.argv.find((a) => a.startsWith('--roadmap='));
  const roadmapId = roadmapArg ? roadmapArg.split('=')[1] : null;

  const dataSource = new DataSource(getTypeOrmConfig());
  await dataSource.initialize();
  try {
    const configService = new ConfigService();
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
