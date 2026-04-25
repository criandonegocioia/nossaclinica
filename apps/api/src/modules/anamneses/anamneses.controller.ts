import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { AnamnesesService } from './anamneses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('anamneses')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class AnamnesesController {
  constructor(private readonly service: AnamnesesService) {}

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
    return { data: [], total: 0 };
  }

  @Get(':id')
  @Roles('ADMIN', 'DENTISTA', 'HOF')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles('ADMIN', 'DENTISTA', 'HOF')
  create(@Body() body: Record<string, unknown>, @CurrentUser('sub') userId: string) {
    return this.service.create({ ...body, professionalId: userId });
  }

  @Patch(':id')
  @Roles('ADMIN', 'DENTISTA', 'HOF')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN', 'DENTISTA')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
