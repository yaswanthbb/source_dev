import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { QaService } from './qa.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateQaQuestionDto } from './dto/create-qa-question.dto';
import { UpdateQaQuestionDto } from './dto/update-qa-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';

@ApiTags('Q&A')
@ApiBearerAuth('bearer-auth')
@Controller()
export class QaController {
  constructor(private readonly qaService: QaService) {}

  @Post('concepts/:conceptId/qa-questions')
  @ApiOperation({ summary: 'Post a Q&A question on a concept' })
  @ApiResponse({ status: 201, description: 'Q&A question posted.' })
  async createQuestion(
    @Param('conceptId') conceptId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateQaQuestionDto,
  ) {
    return this.qaService.createQuestion(conceptId, user, dto);
  }

  @Get('concepts/:conceptId/qa-questions')
  @ApiOperation({ summary: 'List Q&A discussion for a concept' })
  @ApiResponse({
    status: 200,
    description:
      'Questions and nested answers retrieved. AI answers are only included for the developer who asked (admins excepted).',
  })
  async getQuestionsForConcept(
    @Param('conceptId') conceptId: string,
    @CurrentUser() user: User,
  ) {
    return this.qaService.getQuestionsForConcept(conceptId, user);
  }

  @Patch('qa-questions/:id')
  @ApiOperation({ summary: 'Update a Q&A question (Asker / Admin)' })
  @ApiResponse({ status: 200, description: 'Q&A question updated.' })
  async updateQuestion(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateQaQuestionDto,
  ) {
    return this.qaService.updateQuestion(id, user, dto);
  }

  @Delete('qa-questions/:id')
  @ApiOperation({ summary: 'Delete a Q&A question (Asker / Admin)' })
  @ApiResponse({ status: 200, description: 'Q&A question deleted.' })
  async deleteQuestion(@Param('id') id: string, @CurrentUser() user: User) {
    return this.qaService.deleteQuestion(id, user);
  }

  @Post('qa-questions/:id/answers')
  @ApiOperation({
    summary: 'Post an answer in the discussion (any developer)',
  })
  @ApiResponse({ status: 201, description: 'Answer posted.' })
  async createAnswer(
    @Param('id') questionId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateAnswerDto,
  ) {
    return this.qaService.createAnswer(questionId, user, dto);
  }

  @Patch('answers/:id')
  @ApiOperation({ summary: 'Update an answer (Answer Author / Admin)' })
  @ApiResponse({ status: 200, description: 'Answer updated.' })
  async updateAnswer(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateAnswerDto,
  ) {
    return this.qaService.updateAnswer(id, user, dto);
  }

  @Delete('answers/:id')
  @ApiOperation({ summary: 'Delete an answer (Answer Author / Admin)' })
  @ApiResponse({ status: 200, description: 'Answer deleted.' })
  async deleteAnswer(@Param('id') id: string, @CurrentUser() user: User) {
    return this.qaService.deleteAnswer(id, user);
  }

  @Patch('answers/:id/verify')
  @ApiOperation({
    summary: 'Mark an answer verified (Concept Author / Admin)',
  })
  @ApiResponse({ status: 200, description: 'Answer marked verified.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Concept author or Admin required).',
  })
  async verifyAnswer(@Param('id') id: string, @CurrentUser() user: User) {
    return this.qaService.setAnswerVerified(id, user, true);
  }

  @Patch('answers/:id/unverify')
  @ApiOperation({
    summary: 'Remove verification from an answer (Concept Author / Admin)',
  })
  @ApiResponse({ status: 200, description: 'Answer verification removed.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Concept author or Admin required).',
  })
  async unverifyAnswer(@Param('id') id: string, @CurrentUser() user: User) {
    return this.qaService.setAnswerVerified(id, user, false);
  }
}
