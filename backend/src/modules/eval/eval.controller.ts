import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { EvalService } from './eval.service';
import { EvalPsychometricsService } from './eval-psychometrics.service';
import {
  EvalVersionDto,
  EvalCandidateDto,
  EvalCompareDto,
  EvalCompilationDto,
  EvalExpertReviewDto,
  EvalReplacementDto,
} from './dto/eval.dto';

@ApiTags('Admin Evaluation')
@ApiBearerAuth('bearer-auth')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/eval')
export class EvalController {
  constructor(private readonly evals: EvalService) {}
  @Get('rubric') rubric() {
    return this.evals.rubric();
  }
  @Get('goldens') goldens(@CurrentUser() user: User) {
    return this.evals.goldens(user);
  }
  @Get('runs/:id') run(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.evals.run(id, user);
  }
  @Post('candidates') candidate(
    @Body() dto: EvalCandidateDto,
    @CurrentUser() user: User,
  ) {
    return this.evals.createCandidate(
      dto.task,
      dto.version,
      dto.systemTemplate,
      dto.changelog,
      user,
    );
  }
  @Post('shadow')
  @ApiOperation({
    summary:
      'Bounded paid shadow eval, internal quota-free logs; never serves artifacts',
  })
  shadow(@Body() dto: EvalVersionDto, @CurrentUser() user: User) {
    return this.evals.shadow(dto.task, dto.version, user);
  }
  @Post('regression') regression(@CurrentUser() user: User) {
    return this.evals.regression(user);
  }
  @Post('comparisons') compare(
    @Body() dto: EvalCompareDto,
    @CurrentUser() user: User,
  ) {
    return this.evals.compare(
      dto.task,
      dto.baselineVersion,
      dto.candidateVersion,
      user,
    );
  }
  @Post('comparisons/:id/promote') promote(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.evals.promote(id, user);
  }
  @Post('tasks/:task/rollback') rollback(
    @Param('task') task: string,
    @CurrentUser() user: User,
  ) {
    return this.evals.rollback(task, user);
  }
  @Post('compilations/:id') compilation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EvalCompilationDto,
    @CurrentUser() user: User,
  ) {
    return this.evals.evaluateCompilation(id, user, dto.judge === true);
  }
  @Post('runs/:id/expert-reviews') expert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EvalExpertReviewDto,
    @CurrentUser() user: User,
  ) {
    return this.evals.expertReview(id, user, dto);
  }
}
@ApiTags('Question Evaluation')
@ApiBearerAuth('bearer-auth')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.DEVELOPER)
@Controller('eval/questions')
export class EvalQuestionController {
  constructor(private readonly metrics: EvalPsychometricsService) {}
  @Get(':id/psychometrics') stats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.metrics.stats(id, user);
  }
  @Post(':id/replacements') replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EvalReplacementDto,
    @CurrentUser() user: User,
  ) {
    return this.metrics.replace(id, user, dto, dto.reason);
  }
}
