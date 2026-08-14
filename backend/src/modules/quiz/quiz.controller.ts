import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@ApiTags('MCQ Quiz')
@ApiBearerAuth('bearer-auth')
@Controller()
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('concepts/:conceptId/questions')
  @ApiOperation({
    summary: 'Create MCQ question for a concept (Concept Author / Admin)',
  })
  @ApiResponse({
    status: 201,
    description: 'MCQ question and options created.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation error: Min 2 options and exactly 1 correct required.',
  })
  async createQuestion(
    @Param('conceptId') conceptId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.quizService.createQuestion(conceptId, user, dto);
  }

  @Get('concepts/:conceptId/questions')
  @ApiOperation({
    summary:
      'Get MCQ questions for a concept (isCorrect stripped for students)',
  })
  @ApiResponse({ status: 200, description: 'Questions and options retrieved.' })
  async getQuestionsForConcept(
    @Param('conceptId') conceptId: string,
    @CurrentUser() user: User,
  ): Promise<Record<string, unknown>[]> {
    return this.quizService.getQuestionsForConcept(conceptId, user);
  }

  @Patch('questions/:id')
  @ApiOperation({
    summary: 'Update MCQ question text / orderIndex (Concept Author / Admin)',
  })
  @ApiResponse({ status: 200, description: 'MCQ question updated.' })
  async updateQuestion(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.quizService.updateQuestion(id, user, dto);
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Delete MCQ question (Concept Author / Admin)' })
  @ApiResponse({ status: 200, description: 'MCQ question deleted.' })
  async deleteQuestion(@Param('id') id: string, @CurrentUser() user: User) {
    return this.quizService.deleteQuestion(id, user);
  }

  @Patch('questions/:id/options/:optionId')
  @ApiOperation({ summary: 'Update MCQ option (Concept Author / Admin)' })
  @ApiResponse({ status: 200, description: 'MCQ option updated.' })
  async updateOption(
    @Param('id') questionId: string,
    @Param('optionId') optionId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateOptionDto,
  ) {
    return this.quizService.updateOption(questionId, optionId, user, dto);
  }

  @Post('questions/:id/attempt')
  @ApiOperation({
    summary: 'Submit attempt for MCQ question (max 3 tries per student)',
  })
  @ApiResponse({
    status: 201,
    description:
      'Attempt recorded, returns correctness and revealed answer if resolved.',
  })
  @ApiResponse({
    status: 400,
    description: 'No attempts remaining or already answered correctly.',
  })
  async submitAttempt(
    @Param('id') questionId: string,
    @CurrentUser() user: User,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.quizService.submitAttempt(questionId, user, dto);
  }

  @Get('concepts/:conceptId/quiz-status')
  @ApiOperation({
    summary: 'Get current user quiz completion status for a concept',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz status and attempt history retrieved.',
  })
  async getQuizStatus(
    @Param('conceptId') conceptId: string,
    @CurrentUser() user: User,
  ): Promise<Record<string, unknown>> {
    return this.quizService.getQuizStatus(conceptId, user);
  }
}
