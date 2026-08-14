import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { Submission } from './entities/submission.entity';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Assignment, Submission])],
  controllers: [AssignmentsController, SubmissionsController],
  providers: [AssignmentsService, SubmissionsService],
  exports: [AssignmentsService, SubmissionsService, TypeOrmModule],
})
export class AssignmentsModule {}
