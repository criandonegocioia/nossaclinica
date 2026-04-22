import {
  Controller, Get, Post, Body, Param, Query, Res,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @Roles('ADMIN', 'DENTISTA', 'HOF', 'RECEPCAO')
  findAll(@Query('patientId') patientId?: string, @Query('type') type?: string) {
    return this.documentsService.findAll(patientId, type);
  }

  @Get(':id')
  @Roles('ADMIN', 'DENTISTA', 'HOF', 'RECEPCAO')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'DENTISTA', 'HOF')
  create(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentsService.create(createDocumentDto);
  }

  @Get(':id/pdf')
  @Roles('ADMIN', 'DENTISTA', 'HOF', 'RECEPCAO')
  generatePdf(@Param('id') id: string, @Res() res: Response) {
    return this.documentsService.generatePdf(id, res);
  }
}
