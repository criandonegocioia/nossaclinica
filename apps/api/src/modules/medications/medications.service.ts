import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MedicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, category, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.MedicationWhereInput = { active: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { activeIngredient: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category as never;

    const [data, total] = await Promise.all([
      this.prisma.medication.findMany({
        where, skip, take: limit, orderBy: { name: 'asc' },
      }),
      this.prisma.medication.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const med = await this.prisma.medication.findUnique({ where: { id } });
    if (!med) throw new NotFoundException('Medicamento não encontrado');
    return med;
  }

  async create(data: Prisma.MedicationCreateInput) {
    return this.prisma.medication.create({ data });
  }

  async update(id: string, data: Prisma.MedicationUpdateInput) {
    return this.prisma.medication.update({ where: { id }, data });
  }

  async deactivate(id: string) {
    return this.prisma.medication.update({ where: { id }, data: { active: false } });
  }

  /** Check for potential interactions with patient's known allergies from anamnesis */
  async checkInteractions(id: string, patientId: string) {
    const [med, anamnesis] = await Promise.all([
      this.prisma.medication.findUnique({ where: { id } }),
      this.prisma.anamnesis.findFirst({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!med) throw new NotFoundException('Medicamento não encontrado');

    const allergies: string[] = (anamnesis?.data as Record<string, string[]>)?.allergies ?? [];
    const warnings: string[] = [];

    if (med.contraindications) {
      const contraWords = med.contraindications.toLowerCase().split(/[,;.\s]+/);
      for (const allergy of allergies) {
        if (contraWords.some((w) => allergy.toLowerCase().includes(w))) {
          warnings.push(`Paciente alérgico a "${allergy}" — contraindicação: ${med.contraindications}`);
        }
      }
    }

    return { hasWarnings: warnings.length > 0, warnings, medication: med };
  }
}
