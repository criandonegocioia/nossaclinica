import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  findAll(
    @Query('stage') stage?: string,
    @Query('source') source?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leadsService.findAll({
      stage, source, assignedTo, search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 100,
    });
  }

  @Get('kpis')
  getKpis() {
    return this.leadsService.getKpis();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.leadsService.findById(id);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.leadsService.create(body as never);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.leadsService.update(id, body as never);
  }

  @Patch(':id/stage')
  updateStage(
    @Param('id') id: string,
    @Body('stage') stage: string,
  ) {
    return this.leadsService.updateStage(id, stage);
  }

  @Post(':id/activities')
  addActivity(
    @Param('id') leadId: string,
    @Body() body: { type: string; content: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.leadsService.addActivity(leadId, { ...body, userId });
  }

  @Post(':id/convert')
  convertToPatient(@Param('id') id: string) {
    return this.leadsService.convertToPatient(id);
  }
}
