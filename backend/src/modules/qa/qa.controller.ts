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
  @ApiOperation({ summary: 'List Q&A questions and answers for a concept' })
  @ApiResponse({
    status: 200,
    description: 'Questions and nested answers retrieved.',
  })
  async getQuestionsForConcept(@Param('conceptId') conceptId: string) {
    return this.qaService.getQuestionsForConcept(conceptId);
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
    summary: 'Post an answer to a Q&A question (Approved Instructor / Admin)',
  })
  @ApiResponse({ status: 201, description: 'Answer posted.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Approved instructor or Admin required).',
  })
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
}
