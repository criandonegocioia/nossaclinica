import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ScheduleStatus } from '@prisma/client';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class SchedulingController {
  constructor(private readonly service: SchedulingService) {}

  @Get()
  findAll(
    @Query('professionalId') professionalId?: string,
    @Query('roomId') roomId?: string,
    @Query('patientId') patientId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({ professionalId, roomId, patientId, startDate, endDate, status });
  }

  @Get('today')
  getToday(@Query('professionalId') professionalId?: string) {
    return this.service.getTodaySchedules(professionalId);
  }

  @Get('dashboard-stats')
  getDashboardStats() {
    return this.service.getDashboardStats();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() body: Record<string, unknown>, @CurrentUser('sub') userId: string) {
    return this.service.create({ ...body, createdById: userId } as never);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: ScheduleStatus) {
    return this.service.updateStatus(id, status);
  }

  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body() body: { startAt: string; endAt: string; professionalId?: string; roomId?: string; procedureId?: string; notes?: string },
  ) {
    return this.service.reschedule(id, body);
  }
}
