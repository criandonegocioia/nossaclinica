import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.patientsService.findAll({
      search,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('stats')
  getStats() {
    return this.patientsService.getStats();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.patientsService.findById(id);
  }

  @Post()
  create(@Body() body: Record<string, unknown>, @CurrentUser('sub') userId: string) {
    return this.patientsService.create({ ...body, createdBy: userId } as never);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.patientsService.update(id, body as never);
  }
}
