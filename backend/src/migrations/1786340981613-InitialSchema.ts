import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1786340981613 implements MigrationInterface {
  name = 'InitialSchema1786340981613';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await queryRunner.query(
      `CREATE TYPE "public"."instructor_profiles_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );

    await queryRunner.query(
      `CREATE TABLE "instructor_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "bio" text, "status" "public"."instructor_profiles_status_enum" NOT NULL DEFAULT 'pending', "invited_by_user_id" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "REL_3fccb84e75aaedf9f9cbdaabf6" UNIQUE ("user_id"), CONSTRAINT "PK_2316af0e9c1cbde4ff47291a975" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('student', 'instructor', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "name" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'student', "timezone" character varying NOT NULL DEFAULT 'UTC', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roadmaps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "title" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "created_by_user_id" uuid, CONSTRAINT "UQ_c0bf076764c15eeaf8c288e84fd" UNIQUE ("slug"), CONSTRAINT "PK_9b0d527f9c64d15405c21e7ca54" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "modules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "roadmap_id" uuid NOT NULL, "title" character varying NOT NULL, "order_index" integer NOT NULL, CONSTRAINT "PK_7dbefd488bd96c5bf31f0ce0c95" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "concepts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "title" character varying NOT NULL, "slug" character varying NOT NULL, "content" text NOT NULL, "author_id" uuid, CONSTRAINT "UQ_cd4dccd7aae91ec4b78c6e35b25" UNIQUE ("slug"), CONSTRAINT "PK_0026cb8bc253eab30b171606891" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "module_concepts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "module_id" uuid NOT NULL, "concept_id" uuid NOT NULL, "order_index" integer NOT NULL, CONSTRAINT "UQ_f084b50f9066b12896842d9498e" UNIQUE ("module_id", "concept_id"), CONSTRAINT "PK_14faadc560645b9c434269efc3f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "concept_prerequisites" ("concept_id" uuid NOT NULL, "prerequisite_concept_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_07014df29733859666f930aaf81" PRIMARY KEY ("concept_id", "prerequisite_concept_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_concept_progress_status_enum" AS ENUM('not_started', 'in_progress', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_concept_progress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "concept_id" uuid NOT NULL, "status" "public"."user_concept_progress_status_enum" NOT NULL DEFAULT 'not_started', "completed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_ffcd5cfb057d192aa4f51caa1c7" UNIQUE ("user_id", "concept_id"), CONSTRAINT "PK_f0f3cf26e86ded121765afce9c4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "concept_id" uuid NOT NULL, "question" text NOT NULL, "rubric" text NOT NULL, "created_by_user_id" uuid, CONSTRAINT "PK_c54ca359535e0012b04dcbd80ee" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."submissions_ai_confidence_enum" AS ENUM('high', 'low')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."submissions_status_enum" AS ENUM('auto_graded', 'flagged_for_review', 'reviewed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "assignment_id" uuid NOT NULL, "student_id" uuid NOT NULL, "answer_text" text NOT NULL, "attempt_number" integer NOT NULL, "ai_score" integer, "ai_feedback" text, "ai_hint" text, "ai_confidence" "public"."submissions_ai_confidence_enum", "status" "public"."submissions_status_enum" NOT NULL, "instructor_feedback" text, "reviewed_by_user_id" uuid, CONSTRAINT "PK_10b3be95b8b2fb1e482e07d706b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "concept_id" uuid NOT NULL, "student_id" uuid NOT NULL, "body" text NOT NULL, CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "question_id" uuid NOT NULL, "instructor_id" uuid, "body" text NOT NULL, CONSTRAINT "PK_9c32cec6c71e06da0254f2226c6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."xp_events_source_type_enum" AS ENUM('concept_completed', 'assignment_passed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "xp_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "source_type" "public"."xp_events_source_type_enum" NOT NULL, "source_id" uuid NOT NULL, "xp_amount" integer NOT NULL, CONSTRAINT "PK_ff53781040f34f17bddeae20f4a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "streaks" ("user_id" uuid NOT NULL, "current_streak" integer NOT NULL DEFAULT '0', "longest_streak" integer NOT NULL DEFAULT '0', "last_activity_date" date NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7ef06a4f4177b11885dd5fb8b29" PRIMARY KEY ("user_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "badges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" text NOT NULL, "criteria_key" character varying NOT NULL, CONSTRAINT "UQ_3ba5d2c8f23e9a29f52d572dd9d" UNIQUE ("criteria_key"), CONSTRAINT "PK_8a651318b8de577e8e217676466" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_badges" ("user_id" uuid NOT NULL, "badge_id" uuid NOT NULL, "earned_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_201b6e34825dc5bd06181320bde" PRIMARY KEY ("user_id", "badge_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor_profiles" ADD CONSTRAINT "FK_3fccb84e75aaedf9f9cbdaabf62" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor_profiles" ADD CONSTRAINT "FK_466c01a71f9ceadbf9e64fd8c85" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" ADD CONSTRAINT "FK_377b03b0c781ead158e3a2aedaf" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "modules" ADD CONSTRAINT "FK_2ed654ee0f14084678dced7692e" FOREIGN KEY ("roadmap_id") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" ADD CONSTRAINT "FK_a3f51f24d2c64ea4defa12438b4" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_concepts" ADD CONSTRAINT "FK_39b1d4a0a84425f549d666a0690" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_concepts" ADD CONSTRAINT "FK_a53a072b52810538f0c1c85bd14" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "concept_prerequisites" ADD CONSTRAINT "FK_82bf89e9f048e3fd7c007545501" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "concept_prerequisites" ADD CONSTRAINT "FK_ac84b497bc160198f81264c62f8" FOREIGN KEY ("prerequisite_concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_concept_progress" ADD CONSTRAINT "FK_0a69c02da099817321f4957a3c3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_concept_progress" ADD CONSTRAINT "FK_0688764e3f6aaf5175b4bcfa8c0" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" ADD CONSTRAINT "FK_7e387614c2c225745b16cb9b2e2" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" ADD CONSTRAINT "FK_f45917d133fe66374d07892c64e" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "submissions" ADD CONSTRAINT "FK_8723840b9b0464206640c268abc" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "submissions" ADD CONSTRAINT "FK_435def3bbd4b4bbb9de1209cdae" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "submissions" ADD CONSTRAINT "FK_e0518edf3aadc28a68a8a5216d1" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_4864e748ec34c084f684b37b124" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_44fd2176b42a38e6bcead0d06aa" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" ADD CONSTRAINT "FK_677120094cf6d3f12df0b9dc5d3" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" ADD CONSTRAINT "FK_fa3e15ee055c37ae35da0cd7fa0" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "xp_events" ADD CONSTRAINT "FK_4b4888f4cfa156c25fa21e2bc80" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "streaks" ADD CONSTRAINT "FK_7ef06a4f4177b11885dd5fb8b29" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badges" ADD CONSTRAINT "FK_f1221d9b1aaa64b1f3c98ed46d3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badges" ADD CONSTRAINT "FK_715b81e610ab276ff6603cfc8e8" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_badges" DROP CONSTRAINT "FK_715b81e610ab276ff6603cfc8e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badges" DROP CONSTRAINT "FK_f1221d9b1aaa64b1f3c98ed46d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "streaks" DROP CONSTRAINT "FK_7ef06a4f4177b11885dd5fb8b29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "xp_events" DROP CONSTRAINT "FK_4b4888f4cfa156c25fa21e2bc80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" DROP CONSTRAINT "FK_fa3e15ee055c37ae35da0cd7fa0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" DROP CONSTRAINT "FK_677120094cf6d3f12df0b9dc5d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_44fd2176b42a38e6bcead0d06aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_4864e748ec34c084f684b37b124"`,
    );
    await queryRunner.query(
      `ALTER TABLE "submissions" DROP CONSTRAINT "FK_e0518edf3aadc28a68a8a5216d1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "submissions" DROP CONSTRAINT "FK_435def3bbd4b4bbb9de1209cdae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "submissions" DROP CONSTRAINT "FK_8723840b9b0464206640c268abc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" DROP CONSTRAINT "FK_f45917d133fe66374d07892c64e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" DROP CONSTRAINT "FK_7e387614c2c225745b16cb9b2e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_concept_progress" DROP CONSTRAINT "FK_0688764e3f6aaf5175b4bcfa8c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_concept_progress" DROP CONSTRAINT "FK_0a69c02da099817321f4957a3c3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "concept_prerequisites" DROP CONSTRAINT "FK_ac84b497bc160198f81264c62f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "concept_prerequisites" DROP CONSTRAINT "FK_82bf89e9f048e3fd7c007545501"`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_concepts" DROP CONSTRAINT "FK_a53a072b52810538f0c1c85bd14"`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_concepts" DROP CONSTRAINT "FK_39b1d4a0a84425f549d666a0690"`,
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" DROP CONSTRAINT "FK_a3f51f24d2c64ea4defa12438b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "modules" DROP CONSTRAINT "FK_2ed654ee0f14084678dced7692e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" DROP CONSTRAINT "FK_377b03b0c781ead158e3a2aedaf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor_profiles" DROP CONSTRAINT "FK_466c01a71f9ceadbf9e64fd8c85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor_profiles" DROP CONSTRAINT "FK_3fccb84e75aaedf9f9cbdaabf62"`,
    );
    await queryRunner.query(`DROP TABLE "user_badges"`);
    await queryRunner.query(`DROP TABLE "badges"`);
    await queryRunner.query(`DROP TABLE "streaks"`);
    await queryRunner.query(`DROP TABLE "xp_events"`);
    await queryRunner.query(`DROP TYPE "public"."xp_events_source_type_enum"`);
    await queryRunner.query(`DROP TABLE "answers"`);
    await queryRunner.query(`DROP TABLE "questions"`);
    await queryRunner.query(`DROP TABLE "submissions"`);
    await queryRunner.query(`DROP TYPE "public"."submissions_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."submissions_ai_confidence_enum"`,
    );
    await queryRunner.query(`DROP TABLE "assignments"`);
    await queryRunner.query(`DROP TABLE "user_concept_progress"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_concept_progress_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "concept_prerequisites"`);
    await queryRunner.query(`DROP TABLE "module_concepts"`);
    await queryRunner.query(`DROP TABLE "concepts"`);
    await queryRunner.query(`DROP TABLE "modules"`);
    await queryRunner.query(`DROP TABLE "roadmaps"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "instructor_profiles"`);
    await queryRunner.query(
      `DROP TYPE "public"."instructor_profiles_status_enum"`,
    );
  }
}
