import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * §1 role collapse: Student/Instructor/Admin → Developer/Admin.
 *
 * All existing student + instructor rows become developers (test data only —
 * v1 was never used by real users, so a direct mapping is safe). The
 * `instructor_profiles` table and both enum types tied to the old model are
 * dropped entirely; there is no deprecated path.
 */
export class RoleCollapseToDeveloper1787900000000
  implements MigrationInterface
{
  name = 'RoleCollapseToDeveloper1787900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the column default first: it references the old enum value.
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );

    // Postgres enum columns cannot take a value outside the enum, so convert
    // to TEXT before remapping, then rebuild the enum with the new values.
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'developer' WHERE "role" IN ('student', 'instructor')`,
    );

    await queryRunner.query(`DROP TABLE "instructor_profiles"`);
    await queryRunner.query(
      `DROP TYPE "public"."instructor_profiles_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('developer', 'admin')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"public"."users_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'developer'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT`,
    );
    // Best effort: every developer maps back to student; the admin row keeps
    // its role. Instructor applications cannot be reconstructed.
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'student' WHERE "role" = 'developer'`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('student', 'instructor', 'admin')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"public"."users_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'student'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."instructor_profiles_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "instructor_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "bio" text, "status" "public"."instructor_profiles_status_enum" NOT NULL DEFAULT 'pending', "invited_by_user_id" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "REL_3fccb84e75aaedf9f9cbdaabf6" UNIQUE ("user_id"), CONSTRAINT "PK_2316af0e9c1cbde4ff47291a975" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor_profiles" ADD CONSTRAINT "FK_3fccb84e75aaedf9f9cbdaabf62" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instructor_profiles" ADD CONSTRAINT "FK_466c01a71f9ceadbf9e64fd8c85" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
