import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './modules/auth/decorators/public.decorator';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Welcome greeting endpoint' })
  getHello(): string {
    return this.appService.getHello();
  }
}
