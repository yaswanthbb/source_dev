import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { entities } from '../../config/typeorm.config';
import { EvalService } from './eval.service';
import { EvalJudgeService } from './eval-judge.service';
import { EvalPsychometricsService } from './eval-psychometrics.service';
import { EvalController, EvalQuestionController } from './eval.controller';
describe('eval application wiring without DB/provider connections', () => {
  test('full application resolves eval repositories, services and controllers', async () => {
    const db = new DataSource({ type: 'postgres', entities });
    await (db as any).buildMetadatas();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DataSource)
      .useValue(db)
      .compile();
    try {
      for (const provider of [
        EvalService,
        EvalJudgeService,
        EvalPsychometricsService,
        EvalController,
        EvalQuestionController,
      ])
        expect(module.get(provider)).toBeDefined();
      expect(db.isInitialized).toBe(false);
    } finally {
      await module.close();
    }
  });
});
