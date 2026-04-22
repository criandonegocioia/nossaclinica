import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(patientId?: string, type?: string) {
    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (type && type !== 'all') where.type = type;

    return this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, name: true, cpf: true } },
      }
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { patient: { select: { id: true, name: true, cpf: true } } }
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    return doc;
  }

  async create(createDocumentDto: CreateDocumentDto) {
    return this.prisma.document.create({
      data: {
        type: createDocumentDto.type,
        title: createDocumentDto.title || `Documento - ${createDocumentDto.type}`,
        content: JSON.stringify(createDocumentDto.content),
        patientId: createDocumentDto.patientId,
      }
    });
  }

  async generatePdf(id: string, res: Response) {
    const docData = await this.findOne(id);
    const content = docData.content ? JSON.parse(docData.content) : {};

    const pdf = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="document-${id}.pdf"`);
    pdf.pipe(res);

    // Header
    pdf.fontSize(20).text(`Clínica Odontológica e Estética`, { align: 'center' });
    pdf.moveDown();
    pdf.fontSize(14).text(`Documento: ${docData.type}`, { align: 'center' });
    pdf.fontSize(12).text(`Paciente: ${docData.patient?.name || 'Não informado'}`, { align: 'center' });
    pdf.moveDown(2);

    // Dynamic Body based on document type
    pdf.fontSize(12);
    if (docData.type === 'RECEITUARIO' && content.items) {
      content.items.forEach((item: any, i: number) => {
        pdf.text(`${i + 1}. ${item.medication || ''} - ${item.dosage || ''}`);
        pdf.text(`Modo de uso: ${item.instructions || ''}`);
        pdf.moveDown();
      });
    } else if (docData.type === 'ATESTADO' && content.days) {
      pdf.text(`Atesto para os devidos fins que o paciente ${docData.patient?.name} esteve sob meus cuidados profissionais no dia ${new Date(docData.createdAt).toLocaleDateString('pt-BR')} e necessita de ${content.days} dia(s) de repouso por motivo de saúde.`);
      pdf.moveDown();
      if (content.reason) pdf.text(`Motivo: ${content.reason}`);
    } else if (content.text || content.body) {
      // Custom body from generic document template
      pdf.text(content.text || content.body);
    } else {
      // Fallback
      pdf.text(JSON.stringify(content, null, 2));
    }

    pdf.moveDown(5);
    pdf.text('________________________________________________', { align: 'center' });
    pdf.text('Assinatura do Profissional', { align: 'center' });

    pdf.end();
  }
}
