import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConceptDifficulty1786530225075 implements MigrationInterface {
  name = 'AddConceptDifficulty1786530225075';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."concepts_difficulty_enum" AS ENUM('easy', 'medium', 'hard')`,
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" ADD "difficulty" "public"."concepts_difficulty_enum" NOT NULL DEFAULT 'medium'`,
    );
    await queryRunner.query(`
            INSERT INTO "badges" ("name", "criteria_key", "description") VALUES
            ('First Steps', 'first_concept', 'Complete your first concept'),
            ('Getting Serious', 'five_concepts', 'Complete 5 concepts'),
            ('Dedicated Learner', 'twenty_concepts', 'Complete 20 concepts'),
            ('3-Day Streak', 'three_day_streak', 'Maintain a 3-day learning streak'),
            ('Week Warrior', 'seven_day_streak', 'Maintain a 7-day learning streak'),
            ('XP Rookie', 'hundred_xp', 'Earn 100 total XP'),
            ('XP Grinder', 'five_hundred_xp', 'Earn 500 total XP')
            ON CONFLICT (criteria_key) DO NOTHING
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "concepts" DROP COLUMN "difficulty"`);
    await queryRunner.query(`DROP TYPE "public"."concepts_difficulty_enum"`);
  }
}
