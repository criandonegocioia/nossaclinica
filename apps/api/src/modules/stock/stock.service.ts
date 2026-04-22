import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, BatchStatus } from '@prisma/client';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Products ─────────────────────────────────
  async findAllProducts(params: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, category, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { active: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category as never;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          batches: {
            where: { status: { not: 'DEPLETED' } },
            orderBy: { expiresAt: 'asc' },
          },
          _count: { select: { movements: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Compute currentStock from active batches
    const enriched = products.map((p) => ({
      ...p,
      currentStock: p.batches.reduce((sum, b) => sum + b.quantity, 0),
    }));

    return { data: enriched, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        batches: { orderBy: { expiresAt: 'asc' } },
        movements: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async createProduct(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({ data });
  }

  async updateProduct(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({ where: { id }, data });
  }

  // ── Batches ───────────────────────────────────
  async createBatch(data: {
    productId: string;
    batchNumber: string;
    expiresAt: string;
    quantity: number;
    unitCost?: number;
    purchaseDate?: string;
  }) {
    const { productId, quantity, expiresAt, ...rest } = data;

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const expiryDate = new Date(expiresAt);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const status: BatchStatus = daysUntilExpiry <= 0 ? 'EXPIRED' : daysUntilExpiry <= 30 ? 'EXPIRING' : 'ACTIVE';

    const batch = await this.prisma.batch.create({
      data: {
        ...rest,
        productId,
        quantity,
        initialQty: quantity,
        expiresAt: expiryDate,
        status,
      },
    });

    // Log entry movement
    await this.prisma.stockMovement.create({
      data: {
        productId,
        batchId: batch.id,
        type: 'ENTRY',
        quantity,
        reason: `Compra — Lote ${batch.batchNumber}`,
        userId: 'system',
      },
    });

    return batch;
  }

  // ── Movements ─────────────────────────────────
  async createMovement(data: {
    productId: string;
    batchId?: string;
    type: string;
    quantity: number;
    reason?: string;
    patientId?: string;
    hofRecordId?: string;
    userId: string;
  }) {
    const { productId, quantity, type } = data;

    // Validate quantity for exit types
    if (['EXIT', 'ADJUSTMENT', 'EXPIRED', 'RETURN'].includes(type)) {
      const batches = await this.prisma.batch.findMany({
        where: { productId, status: { not: 'DEPLETED' } },
      });
      const totalStock = batches.reduce((s, b) => s + b.quantity, 0);
      if (quantity > totalStock) {
        throw new BadRequestException(
          `Estoque insuficiente. Disponível: ${totalStock}, Solicitado: ${quantity}`,
        );
      }

      // Deduct from batches FIFO (oldest expiry first)
      let remaining = quantity;
      const sortedBatches = batches.sort(
        (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
      );
      for (const batch of sortedBatches) {
        if (remaining <= 0) break;
        const deduct = Math.min(batch.quantity, remaining);
        const newQty = batch.quantity - deduct;
        await this.prisma.batch.update({
          where: { id: batch.id },
          data: { quantity: newQty, status: newQty === 0 ? 'DEPLETED' : batch.status },
        });
        remaining -= deduct;
      }
    }

    return this.prisma.stockMovement.create({
      data: {
        productId,
        batchId: data.batchId,
        type: type as never,
        quantity,
        reason: data.reason,
        patientId: data.patientId,
        hofRecordId: data.hofRecordId,
        userId: data.userId,
      },
    });
  }

  // ── Alerts ────────────────────────────────────
  async getAlerts() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [expiringBatches, lowStockProducts, emptyProducts] = await Promise.all([
      this.prisma.batch.findMany({
        where: {
          expiresAt: { lte: thirtyDaysFromNow },
          status: { in: ['ACTIVE', 'EXPIRING'] },
          quantity: { gt: 0 },
        },
        include: { product: true },
        orderBy: { expiresAt: 'asc' },
      }),
      this.prisma.product.findMany({
        where: { active: true },
        include: {
          batches: { where: { status: { not: 'DEPLETED' } } },
        },
      }).then((products) =>
        products.filter((p) => {
          const stock = p.batches.reduce((s, b) => s + b.quantity, 0);
          return stock > 0 && stock < p.minStock;
        }),
      ),
      this.prisma.product.findMany({
        where: { active: true },
        include: {
          batches: { where: { status: { not: 'DEPLETED' } } },
        },
      }).then((products) =>
        products.filter((p) => p.batches.reduce((s, b) => s + b.quantity, 0) === 0),
      ),
    ]);

    return { expiringBatches, lowStockProducts, emptyProducts };
  }

  // ── Summary ───────────────────────────────────
  async getSummary() {
    const products = await this.prisma.product.findMany({
      where: { active: true },
      include: { batches: { where: { status: { not: 'DEPLETED' } } } },
    });

    const total = products.length;
    const expiring = await this.prisma.batch.count({
      where: {
        status: 'EXPIRING',
        quantity: { gt: 0 },
      },
    });
    const lowStock = products.filter(
      (p) => p.batches.reduce((s, b) => s + b.quantity, 0) < p.minStock,
    ).length;
    const empty = products.filter(
      (p) => p.batches.reduce((s, b) => s + b.quantity, 0) === 0,
    ).length;

    return { total, expiring, lowStock, empty };
  }
}
