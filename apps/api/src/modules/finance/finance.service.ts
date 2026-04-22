import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    patientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { patientId, status, startDate, endDate, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.finance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { patient: { select: { id: true, name: true } } },
      }),
      this.prisma.finance.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getSummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [monthly, lastMonth, pending, overdue, recentPayments] = await Promise.all([
      // Receita do mês atual (pago)
      this.prisma.finance.aggregate({
        where: { 
          status: 'PAGO',
          OR: [
            { paidAt: { gte: startOfMonth } },
            { paidAt: null, createdAt: { gte: startOfMonth } }
          ]
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Receita do mês passado
      this.prisma.finance.aggregate({
        where: { 
          status: 'PAGO',
          OR: [
            { paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
            { paidAt: null, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }
          ]
        },
        _sum: { amount: true },
      }),
      // Pendente
      this.prisma.finance.aggregate({
        where: { status: 'PENDENTE' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Vencidos
      this.prisma.finance.count({
        where: { status: 'PENDENTE', dueDate: { lt: now } },
      }),
      // Receita por dia (últimos 7 dias)
      this.prisma.finance.findMany({
        where: {
          status: 'PAGO',
          OR: [
            { paidAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
            { paidAt: null, createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }
          ]
        },
        select: { paidAt: true, createdAt: true, amount: true },
      }),
    ]);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      return { dateStr: d.toISOString().split('T')[0], total: 0, dayIndex: d.getDay() };
    });

    for (const tx of recentPayments) {
      const activeDate = tx.paidAt ?? tx.createdAt;
      const txD = new Date(activeDate.getTime() - activeDate.getTimezoneOffset() * 60000);
      const dateStr = txD.toISOString().split('T')[0];
      const dayBucket = last7Days.find(d => d.dateStr === dateStr);
      if (dayBucket) dayBucket.total += Number(tx.amount);
    }

    const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const revenueByDay = last7Days.map(d => d.total);
    const revenueDays = last7Days.map(d => DAY_NAMES[d.dayIndex]);

    const monthlyRevenue = Number(monthly._sum.amount ?? 0);
    const lastMonthRevenue = Number(lastMonth._sum.amount ?? 0);
    const growthRate = lastMonthRevenue > 0
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    return {
      monthlyRevenue,
      monthlyTransactions: monthly._count.id,
      pendingAmount: Number(pending._sum.amount ?? 0),
      pendingCount: pending._count.id,
      overdueCount: overdue,
      growthRate,
      revenueByDay,
      revenueDays,
    };
  }

  async create(data: Record<string, unknown>) {
    return this.prisma.finance.create({ data: data as never });
  }

  async updateStatus(id: string, data: {
    status: string;
    paidAt?: string;
    paymentMethod?: string;
  }) {
    return this.prisma.finance.update({
      where: { id },
      data: {
        status: data.status as never,
        paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
        paymentMethod: data.paymentMethod as never,
      },
    });
  }
}
