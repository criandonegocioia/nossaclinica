import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('medical-records')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class MedicalRecordsController {
  constructor(private readonly service: MedicalRecordsService) {}

  @Get()
  @Roles('ADMIN', 'DENTISTA', 'HOF')
  findAll(
    @Query('patientId') patientId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (patientId) {
      return this.service.findByPatient(
        patientId,
        page ? parseInt(page, 10) : 1,
        limit ? parseInt(limit, 10) : 20,
      );
    }
    return [];
  }

  @Get('patient/:patientId')
  @Roles('ADMIN', 'DENTISTA', 'HOF')
  findByPatient(
    @Param('patientId') patientId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findByPatient(
      patientId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'DENTISTA', 'HOF')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles('ADMIN', 'DENTISTA', 'HOF')
  create(@Body() body: Record<string, unknown>, @CurrentUser('sub') userId: string) {
    return this.service.create({ ...body, professionalId: userId } as never);
  }

  @Post(':id/new-version')
  @Roles('ADMIN', 'DENTISTA', 'HOF')
  createNewVersion(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.createNewVersion(id, body, userId);
  }

  @Patch(':id/finalize')
  @Roles('ADMIN', 'DENTISTA', 'HOF')
  finalize(@Param('id') id: string) {
    return this.service.finalize(id);
  }
}
