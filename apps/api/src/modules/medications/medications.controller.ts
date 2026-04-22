import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('medications')
@UseGuards(JwtAuthGuard)
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.medicationsService.findAll({
      search, category,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.medicationsService.findById(id);
  }

  @Get(':id/interactions')
  checkInteractions(
    @Param('id') id: string,
    @Query('patientId') patientId: string,
  ) {
    return this.medicationsService.checkInteractions(id, patientId);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.medicationsService.create(body as never);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.medicationsService.update(id, body as never);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.medicationsService.deactivate(id);
  }
}
