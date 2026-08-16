import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoadmapsService } from './roadmaps.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateRoadmapDto } from './dto/create-roadmap.dto';
import { UpdateRoadmapDto } from './dto/update-roadmap.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { AttachConceptDto } from './dto/attach-concept.dto';
import { UpdateModuleConceptDto } from './dto/update-module-concept.dto';
import { AddModulePrerequisiteDto } from './dto/add-module-prerequisite.dto';

@ApiTags('Roadmaps & Modules')
@ApiBearerAuth('bearer-auth')
@UseGuards(RolesGuard)
@Controller()
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @Post('roadmaps')
  @ApiOperation({ summary: 'Create a roadmap (Approved Instructor / Admin)' })
  @ApiResponse({ status: 201, description: 'Roadmap created successfully.' })
  async createRoadmap(
    @CurrentUser() user: User,
    @Body() dto: CreateRoadmapDto,
  ) {
    return this.roadmapsService.createRoadmap(user, dto);
  }

  @Get('roadmaps')
  @ApiOperation({ summary: 'List all roadmaps' })
  @ApiResponse({ status: 200, description: 'Roadmaps list retrieved.' })
  async findAllRoadmaps() {
    return this.roadmapsService.findAllRoadmaps();
  }

  @Get('roadmaps/:id')
  @ApiOperation({ summary: 'Get roadmap detail with modules and concepts' })
  @ApiResponse({ status: 200, description: 'Roadmap details retrieved.' })
  async findRoadmapById(@Param('id') id: string) {
    return this.roadmapsService.findRoadmapById(id);
  }

  @Patch('roadmaps/:id')
  @ApiOperation({ summary: 'Update a roadmap (Creator / Admin)' })
  @ApiResponse({ status: 200, description: 'Roadmap updated successfully.' })
  async updateRoadmap(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateRoadmapDto,
  ) {
    return this.roadmapsService.updateRoadmap(id, user, dto);
  }

  @Delete('roadmaps/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a roadmap (Admin only)' })
  @ApiResponse({ status: 200, description: 'Roadmap deleted successfully.' })
  async deleteRoadmap(@Param('id') id: string, @CurrentUser() user: User) {
    return this.roadmapsService.deleteRoadmap(id, user);
  }

  // Nested Modules Endpoints
  @Post('roadmaps/:roadmapId/modules')
  @ApiOperation({
    summary: 'Add a module to a roadmap (Roadmap Creator / Admin)',
  })
  @ApiResponse({ status: 201, description: 'Module added to roadmap.' })
  async createModule(
    @Param('roadmapId') roadmapId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateModuleDto,
  ) {
    return this.roadmapsService.createModule(roadmapId, user, dto);
  }

  @Patch('modules/:id')
  @ApiOperation({ summary: 'Update a module (Roadmap Creator / Admin)' })
  @ApiResponse({ status: 200, description: 'Module updated successfully.' })
  async updateModule(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.roadmapsService.updateModule(id, user, dto);
  }

  @Delete('modules/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a module (Admin only)' })
  @ApiResponse({ status: 200, description: 'Module deleted successfully.' })
  async deleteModule(@Param('id') id: string, @CurrentUser() user: User) {
    return this.roadmapsService.deleteModule(id, user);
  }

  // Module-Concepts Endpoints
  @Post('modules/:moduleId/concepts')
  @ApiOperation({
    summary: 'Attach a concept to a module (Roadmap Creator / Admin)',
  })
  @ApiResponse({ status: 201, description: 'Concept attached to module.' })
  async attachConceptToModule(
    @Param('moduleId') moduleId: string,
    @CurrentUser() user: User,
    @Body() dto: AttachConceptDto,
  ) {
    return this.roadmapsService.attachConceptToModule(moduleId, user, dto);
  }

  @Delete('modules/:moduleId/concepts/:conceptId')
  @ApiOperation({
    summary: 'Detach a concept from a module (Roadmap Creator / Admin)',
  })
  @ApiResponse({ status: 200, description: 'Concept detached from module.' })
  async detachConceptFromModule(
    @Param('moduleId') moduleId: string,
    @Param('conceptId') conceptId: string,
    @CurrentUser() user: User,
  ) {
    return this.roadmapsService.detachConceptFromModule(
      moduleId,
      conceptId,
      user,
    );
  }

  @Patch('modules/:moduleId/concepts/:conceptId')
  @ApiOperation({
    summary: 'Reorder a concept within a module (Roadmap Creator / Admin)',
  })
  @ApiResponse({ status: 200, description: 'Module-concept order updated.' })
  async updateModuleConceptOrder(
    @Param('moduleId') moduleId: string,
    @Param('conceptId') conceptId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateModuleConceptDto,
  ) {
    return this.roadmapsService.updateModuleConceptOrder(
      moduleId,
      conceptId,
      user,
      dto,
    );
  }

  // Module-Scoped Prerequisite Endpoints
  @Post('modules/:moduleId/concepts/:conceptId/prerequisites')
  @ApiOperation({
    summary:
      'Link a prerequisite concept within the same module (Roadmap Creator / Admin)',
  })
  @ApiResponse({
    status: 201,
    description: 'Module-scoped prerequisite linked successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid prerequisite (not in module or circular).',
  })
  async attachPrerequisite(
    @Param('moduleId') moduleId: string,
    @Param('conceptId') conceptId: string,
    @CurrentUser() user: User,
    @Body() dto: AddModulePrerequisiteDto,
  ) {
    return this.roadmapsService.attachPrerequisiteToModuleConcept(
      moduleId,
      conceptId,
      dto.prerequisiteConceptId,
      user,
    );
  }

  @Delete(
    'modules/:moduleId/concepts/:conceptId/prerequisites/:prerequisiteConceptId',
  )
  @ApiOperation({
    summary:
      'Remove a prerequisite link within a module (Roadmap Creator / Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Module-scoped prerequisite link removed.',
  })
  async detachPrerequisite(
    @Param('moduleId') moduleId: string,
    @Param('conceptId') conceptId: string,
    @Param('prerequisiteConceptId') prerequisiteConceptId: string,
    @CurrentUser() user: User,
  ) {
    return this.roadmapsService.detachPrerequisiteFromModuleConcept(
      moduleId,
      conceptId,
      prerequisiteConceptId,
      user,
    );
  }
}
