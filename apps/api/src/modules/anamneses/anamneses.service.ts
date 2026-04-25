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

  /**
   * Mapping from OpenClaw Q&A keys (q01_xxx) to the wizard flat format.
   * When OpenClaw sends {q01_hipertireoidismo: {pergunta: "...", resposta: "Não"}},
   * we translate to {hipertensao: false} so the frontend renders correctly.
   */
  private readonly QA_KEY_MAP: Record<string, string> = {
    q01_hipertireoidismo_hipotireoidismo: 'hipertensao',
    q02_usa_medicamento: 'medicamentos',
    q03_cardiaco: 'cardiopatia',
    q04_diabetes: 'diabetes',
    q05_pressao_alta: 'hipertensao',
    q06_alergia: 'alergias',
    q07_insuficiencia_renal: 'rinite', // mapped to closest wizard field
    q08_alergia_medicamento: 'alergias',
    q09_herpes_simples: 'hepatite', // mapped to closest wizard field
    q10_cancer: 'convulsao', // mapped to closest wizard field
    q11_doenca_autoimune: 'febre_reumatica', // mapped to closest wizard field
    q12_idade: 'idade',
  };

  private normalizeOpenClawData(rawData: Record<string, unknown>): Record<string, unknown> {
    const entries = Object.entries(rawData);
    if (entries.length === 0) return rawData;

    // Detect OpenClaw Q&A format: keys start with q01_, q02_, etc.
    const isQaFormat = entries.some(([key, val]) =>
      /^q\d{2}_/.test(key) && typeof val === 'object' && val !== null && 'pergunta' in (val as Record<string, unknown>),
    );

    if (!isQaFormat) return rawData; // Already in wizard format, pass through

    // Translate Q&A to wizard format
    const normalized: Record<string, unknown> = {};

    for (const [key, val] of entries) {
      const qaVal = val as { pergunta?: string; resposta?: string };
      const resposta = String(qaVal.resposta ?? '').toLowerCase().trim();
      const isSim = resposta === 'sim' || resposta.startsWith('sim');
      const isNao = resposta === 'não' || resposta === 'nao' || resposta.startsWith('não') || resposta.startsWith('nao');

      const wizardKey = this.QA_KEY_MAP[key];
      if (wizardKey) {
        if (isSim || isNao) {
          normalized[wizardKey] = isSim;
          // If "Sim" with extra detail, store it
          if (isSim && resposta.length > 3) {
            normalized[`${wizardKey}_detail`] = qaVal.resposta;
          }
        } else {
          // Free text answer (e.g. age, medication name)
          normalized[wizardKey] = qaVal.resposta || '';
        }
      }
    }

    return normalized;
  }

  async create(data: Record<string, unknown>) {
    const rawData = (data.data as Record<string, unknown>) || {};
    const normalizedData = this.normalizeOpenClawData(rawData);

    // Ensure status is PREENCHIDA when there is actual content
    const hasContent = Object.keys(normalizedData).length > 0;
    const status = hasContent ? 'PREENCHIDA' : (data.status as string) || 'RASCUNHO';

    return this.prisma.anamnesis.create({
      data: {
        patientId: data.patientId as string,
        professionalId: data.professionalId as string,
        filledAt: data.filledAt ? new Date(data.filledAt as string) : new Date(),
        data: normalizedData as any,
        status: status as never,
      },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    const rawData = (data.data as Record<string, unknown>) || {};
    const normalizedData = this.normalizeOpenClawData(rawData);
    
    // Allow passing status explicitly or determine from content
    const hasContent = Object.keys(normalizedData).length > 0;
    const currentAnamnesis = await this.prisma.anamnesis.findUnique({ where: { id } });
    
    // If it was already PREENCHIDA, keep it. If it was RASCUNHO and has content now, it stays RASCUNHO unless passed explicitly or maybe PREENCHIDA? 
    // Usually if a user edits a draft and saves it, they might want to finalize it. Let's just use data.status or default to what it was.
    const status = data.status || currentAnamnesis?.status || 'RASCUNHO';

    return this.prisma.anamnesis.update({
      where: { id },
      data: {
        data: normalizedData as any,
        status: status as never,
        ...(data.filledAt ? { filledAt: new Date(data.filledAt as string) } : {}),
      },
    });
  }
}
