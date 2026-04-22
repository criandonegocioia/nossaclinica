import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnamnesesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPatient(patientId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.anamnesis.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          professional: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.anamnesis.count({ where: { patientId } }),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string) {
    return this.prisma.anamnesis.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
      },
    });
  }

  async create(data: Record<string, unknown>) {
    return this.prisma.anamnesis.create({
      data: data as never,
    });
  }
}
