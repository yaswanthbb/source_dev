import { IsBoolean, IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Cross-device UI preferences, stored as one JSONB column on the user.
 *
 * One column rather than one column per preference: the presentation layer is
 * built to take more themes later, so this set is expected to grow, and a
 * migration per checkbox is not a good trade. Each field is still validated
 * individually below — `preferences` is a typed object, not a bag the client
 * can put anything in.
 */
export class UserPreferencesDto {
  @ApiPropertyOptional({
    enum: ['gui', 'cli'],
    description: 'Which interface mode the user works in. New accounts: gui.',
  })
  @IsOptional()
  @IsIn(['gui', 'cli'])
  uiMode?: 'gui' | 'cli';

  @ApiPropertyOptional({
    example: 'terminal',
    description:
      'Visual theme id. Single-theme today; the field exists so a theme swap needs no migration.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]{1,32}$/, {
    message: 'themeId must be a lowercase slug',
  })
  themeId?: string;

  @ApiPropertyOptional({
    example: '/roadmaps/voip-basics/intro/what-is-voip',
    description:
      'Where the user was in the virtual filesystem, so switching modes or devices resumes in place.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\/roadmaps(\/[A-Za-z0-9_-]{1,64}){0,3}$/, {
    message: 'lastLocation must be a valid virtual path',
  })
  lastLocation?: string;

  @ApiPropertyOptional({
    description: 'The one-time "try CLI mode" nudge has been shown.',
  })
  @IsOptional()
  @IsBoolean()
  hasSeenCliNudge?: boolean;

  @ApiPropertyOptional({
    description:
      'The one-time auto-typed CLI welcome has played. Server-side so it is once per account, not once per device.',
  })
  @IsOptional()
  @IsBoolean()
  hasSeenCliWelcome?: boolean;
}
