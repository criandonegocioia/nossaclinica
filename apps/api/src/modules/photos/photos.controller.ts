import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, UseInterceptors, UploadedFile, BadRequestException, NotFoundException, Res
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { z } from 'zod';
import { PhotosService } from './photos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('photos')
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditInterceptor)
export class PhotosController {
  constructor(private readonly service: PhotosService) {}

  @Get('patient/:patientId')
  findByPatient(
    @Param('patientId') patientId: string,
    @Query('category') category?: string,
    @Query('procedureId') procedureId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findByPatient(patientId, {
      category,
      procedureId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 30,
    });
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { dest: './uploads/photos' }))
  create(
    @UploadedFile() file: any, // Express.Multer.File
    @Body() body: any,
    @CurrentUser('sub') userId: string
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }
    return this.service.create({
      patientId: body.patientId,
      uploaderId: userId,
      category: body.category || 'OUTRO',
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      localPath: file.path,
    } as never);
  }

  @Patch(':id/quarantine')
  quarantine(@Param('id') id: string) {
    return this.service.quarantine(id);
  }

  @Public()
  @Get(':id/content')
  async getContent(@Param('id') id: string, @Res() res: Response) {
    const photo = await this.service.findOne(id);
    if (!photo.localPath || !existsSync(photo.localPath)) {
      throw new NotFoundException('Arquivo de imagem não encontrado no disco');
    }
    const file = createReadStream(photo.localPath);
    file.pipe(res);
  }
}
