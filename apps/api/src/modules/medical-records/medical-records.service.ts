import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MedicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPatient(patientId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.medicalRecord.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          professional: { select: { id: true, name: true, avatarUrl: true } },
          photos: { select: { id: true, thumbnailUrl: true, category: true } },
        },
      }),
      this.prisma.medicalRecord.count({ where: { patientId } }),
    ]);

    return { data: records, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        professional: { select: { id: true, name: true } },
        patient: { select: { id: true, name: true } },
        photos: true,
      },
    });
    if (!record) throw new NotFoundException('Prontuário não encontrado');
    return record;
  }

  async create(data: {
    patientId: string;
    professionalId: string;
    scheduleId?: string;
    complaint?: string;
    diagnosis?: string;
    treatmentPlan?: string;
    procedures?: string;
    prescriptions?: string;
    orientations?: string;
    complications?: string;
    professionalSignature?: string;
    isDraft: boolean;
  }) {
    return this.prisma.medicalRecord.create({
      data,
      include: { professional: { select: { id: true, name: true } } },
    });
  }

  /**
   * Creates a new version of a finalized record.
   * The original remains immutable; the new version links to it.
   */
  async createNewVersion(originalId: string, updates: Partial<{
    complaint: string;
    diagnosis: string;
    treatmentPlan: string;
    procedures: string;
    prescriptions: string;
    orientations: string;
    complications: string;
    professionalSignature: string;
  }>, professionalId: string) {
    const original = await this.findById(originalId);

    if (original.isDraft) {
      throw new BadRequestException('Rascunhos podem ser editados diretamente');
    }

    return this.prisma.medicalRecord.create({
      data: {
        patientId: original.patientId,
        professionalId,
        scheduleId: original.scheduleId,
        complaint: updates.complaint ?? original.complaint,
        diagnosis: updates.diagnosis ?? original.diagnosis,
        treatmentPlan: updates.treatmentPlan ?? original.treatmentPlan,
        procedures: updates.procedures ?? original.procedures,
        prescriptions: updates.prescriptions ?? original.prescriptions,
        orientations: updates.orientations ?? original.orientations,
        complications: updates.complications ?? original.complications,
        professionalSignature: updates.professionalSignature ?? original.professionalSignature,
        isDraft: false,
        previousVersionId: originalId,
      },
    });
  }

  /**
   * Finalizes a draft record, making it immutable.
   */
  async finalize(id: string) {
    const record = await this.findById(id);
    if (!record.isDraft) {
      throw new BadRequestException('Prontuário já finalizado');
    }

    return this.prisma.medicalRecord.update({
      where: { id },
      data: { isDraft: false },
    });
  }
}
