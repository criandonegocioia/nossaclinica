import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PhotoCategory } from '@prisma/client';

@Injectable()
export class PhotosService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPatient(patientId: string, params: {
    category?: string;
    procedureId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { category, procedureId, page = 1, limit = 30 } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      patientId,
      quarantinedAt: null,
    };

    if (category) where.category = category as PhotoCategory;
    if (procedureId) where.procedureId = procedureId;

    const [photos, total] = await Promise.all([
      this.prisma.photo.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: { select: { id: true, name: true } },
          procedure: { select: { id: true, name: true } },
        },
      }),
      this.prisma.photo.count({ where: where as never }),
    ]);

    return { data: photos, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id } });
    if (!photo) throw new NotFoundException('Foto não encontrada');
    return photo;
  }

  async create(data: {
    patientId: string;
    uploaderId: string;
    medicalRecordId?: string;
    procedureId?: string;
    category: PhotoCategory;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    localPath?: string;
  }) {
    return this.prisma.photo.create({ data });
  }

  async quarantine(id: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id } });
    if (!photo) throw new NotFoundException('Foto não encontrada');

    return this.prisma.photo.update({
      where: { id },
      data: { quarantinedAt: new Date() },
    });
  }

  async updateDriveInfo(id: string, driveFileId: string, driveLink: string) {
    return this.prisma.photo.update({
      where: { id },
      data: { driveFileId, driveLink },
    });
  }

  async updateThumbnail(id: string, thumbnailUrl: string) {
    return this.prisma.photo.update({
      where: { id },
      data: { thumbnailUrl },
    });
  }
}
