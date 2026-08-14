import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMcqQuiz1786436703834 implements MigrationInterface {
  name = 'AddMcqQuiz1786436703834';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "mcq_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "question_id" uuid NOT NULL, "option_text" text NOT NULL, "is_correct" boolean NOT NULL DEFAULT false, "order_index" integer NOT NULL, CONSTRAINT "PK_3f2f23f5178838900abfae6da9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "mcq_questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "concept_id" uuid NOT NULL, "question_text" text NOT NULL, "order_index" integer NOT NULL, "created_by_user_id" uuid, CONSTRAINT "PK_db103f8e30b96ee52f30429ded9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "mcq_attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "question_id" uuid NOT NULL, "student_id" uuid NOT NULL, "selected_option_id" uuid NOT NULL, "is_correct" boolean NOT NULL, "attempt_number" integer NOT NULL, CONSTRAINT "PK_6f8f0e8c0e6790d23c6a09f5200" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "mcq_options" ADD CONSTRAINT "FK_150dfc55aaa457cce97fc1fde23" FOREIGN KEY ("question_id") REFERENCES "mcq_questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mcq_questions" ADD CONSTRAINT "FK_729e2b808c43fa87d82f7523ddb" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mcq_questions" ADD CONSTRAINT "FK_37d75e1be88fe6471d31f540524" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mcq_attempts" ADD CONSTRAINT "FK_30f842989ea31e32686369d51e6" FOREIGN KEY ("question_id") REFERENCES "mcq_questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mcq_attempts" ADD CONSTRAINT "FK_73b5ba0222a11e567869a562459" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mcq_attempts" ADD CONSTRAINT "FK_a4d6f574b250b8cbc11630b3afc" FOREIGN KEY ("selected_option_id") REFERENCES "mcq_options"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "mcq_attempts" DROP CONSTRAINT "FK_a4d6f574b250b8cbc11630b3afc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mcq_attempts" DROP CONSTRAINT "FK_73b5ba0222a11e567869a562459"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mcq_attempts" DROP CONSTRAINT "FK_30f842989ea31e32686369d51e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mcq_questions" DROP CONSTRAINT "FK_37d75e1be88fe6471d31f540524"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mcq_questions" DROP CONSTRAINT "FK_729e2b808c43fa87d82f7523ddb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mcq_options" DROP CONSTRAINT "FK_150dfc55aaa457cce97fc1fde23"`,
    );
    await queryRunner.query(`DROP TABLE "mcq_attempts"`);
    await queryRunner.query(`DROP TABLE "mcq_questions"`);
    await queryRunner.query(`DROP TABLE "mcq_options"`);
  }
}
