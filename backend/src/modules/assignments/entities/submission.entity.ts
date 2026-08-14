import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SubmissionStatus } from '../../../common/enums/submission-status.enum';
import { AiConfidence } from '../../../common/enums/ai-confidence.enum';
import { Assignment } from './assignment.entity';
import { User } from '../../users/entities/user.entity';

@Entity('submissions')
export class Submission extends BaseEntity {
  @Column({ name: 'assignment_id' })
  assignmentId: string;

  @ManyToOne(() => Assignment, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assignment_id' })
  assignment: Assignment;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'text', name: 'answer_text' })
  answerText: string;

  @Column({ type: 'int', name: 'attempt_number' })
  attemptNumber: number;

  @Column({ type: 'int', name: 'ai_score', nullable: true })
  aiScore: number | null;

  @Column({ type: 'text', name: 'ai_feedback', nullable: true })
  aiFeedback: string | null;

  @Column({ type: 'text', name: 'ai_hint', nullable: true })
  aiHint: string | null;

  @Column({
    type: 'enum',
    enum: AiConfidence,
    name: 'ai_confidence',
    nullable: true,
  })
  aiConfidence: AiConfidence | null;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
  })
  status: SubmissionStatus;

  @Column({ type: 'text', name: 'instructor_feedback', nullable: true })
  instructorFeedback: string | null;

  @Column({ name: 'reviewed_by_user_id', nullable: true })
  reviewedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewed_by_user_id' })
  reviewedBy: User | null;
}
