import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConceptsService } from './concepts.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateConceptDto } from './dto/create-concept.dto';
import { UpdateConceptDto } from './dto/update-concept.dto';
import { AddPrerequisiteDto } from './dto/add-prerequisite.dto';

@ApiTags('Concepts & Prerequisites')
@ApiBearerAuth('bearer-auth')
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
    summary: 'Get concept detail with prerequisites and roadmap usages',
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
  @ApiOperation({ summary: 'Delete a concept (Concept Author / Admin)' })
  @ApiResponse({ status: 200, description: 'Concept deleted successfully.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Concept has student submissions.',
  })
  async deleteConcept(@Param('id') id: string, @CurrentUser() user: User) {
    return this.conceptsService.deleteConcept(id, user);
  }

  @Post(':id/prerequisites')
  @ApiOperation({
    summary: 'Add a prerequisite concept (Concept Author / Admin)',
  })
  @ApiResponse({ status: 201, description: 'Prerequisite added.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Self or circular prerequisite detected.',
  })
  async addPrerequisite(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: AddPrerequisiteDto,
  ) {
    return this.conceptsService.addPrerequisite(id, user, dto);
  }

  @Delete(':id/prerequisites/:prerequisiteId')
  @ApiOperation({
    summary: 'Remove a prerequisite concept (Concept Author / Admin)',
  })
  @ApiResponse({ status: 200, description: 'Prerequisite removed.' })
  async removePrerequisite(
    @Param('id') id: string,
    @Param('prerequisiteId') prerequisiteId: string,
    @CurrentUser() user: User,
  ) {
    return this.conceptsService.removePrerequisite(id, prerequisiteId, user);
  }
}
