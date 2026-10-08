/** Explicit paid provider regression. Run only after migrations with EVAL_ENABLED=true and an admin id. */
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { EvalService } from '../src/modules/eval/eval.service';
import { User } from '../src/modules/users/entities/user.entity';
import { UserRole } from '../src/common/enums/user-role.enum';
async function main() {
  const id = process.env.EVAL_ADMIN_USER_ID;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    throw new Error('Set EVAL_ADMIN_USER_ID to an existing admin UUID');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['warn', 'error'],
  });
  try {
    const actor = await app
      .get(DataSource)
      .getRepository(User)
      .findOne({ where: { id }, select: ['id', 'role'] });
    if (actor?.role !== UserRole.ADMIN)
      throw new Error('The configured actor is not an admin');
    const report = await app.get(EvalService).regression(actor);
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) process.exitCode = 1;
  } finally {
    await app.close();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Eval regression failed',
  );
  process.exitCode = 1;
});
