import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConceptsService } from './concepts.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateConceptDto } from './dto/create-concept.dto';
import { UpdateConceptDto } from './dto/update-concept.dto';

@ApiTags('Concepts')
@ApiBearerAuth('bearer-auth')
@UseGuards(RolesGuard)
@Controller('concepts')
export class ConceptsController {
  constructor(private readonly conceptsService: ConceptsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a concept (Approved Instructor / Admin)' })
  @ApiResponse({ status: 201, description: 'Concept created successfully.' })
  async createConcept(
    @CurrentUser() user: User,
    @Body() dto: CreateConceptDto,
  ) {
    return this.conceptsService.createConcept(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List concepts with optional title search' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for concept title',
  })
  @ApiResponse({ status: 200, description: 'Concepts retrieved.' })
  async findAllConcepts(@Query('search') search?: string) {
    return this.conceptsService.findAllConcepts(search);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get concept detail with roadmap module placements',
  })
  @ApiResponse({ status: 200, description: 'Concept details retrieved.' })
  async findConceptById(
    @Param('id') id: string,
  ): Promise<Record<string, unknown>> {
    return this.conceptsService.findConceptById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a concept (Concept Author / Admin)' })
  @ApiResponse({ status: 200, description: 'Concept updated successfully.' })
  async updateConcept(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateConceptDto,
  ) {
    return this.conceptsService.updateConcept(id, user, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a concept (Admin only)' })
  @ApiResponse({ status: 200, description: 'Concept deleted successfully.' })
  async deleteConcept(@Param('id') id: string, @CurrentUser() user: User) {
    return this.conceptsService.deleteConcept(id, user);
  }
}
