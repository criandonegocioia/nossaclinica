import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // ── Products ──────────────────────────────────
  @Get('products')
  findAllProducts(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.stockService.findAllProducts({
      search,
      category,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('products/summary')
  getSummary() {
    return this.stockService.getSummary();
  }

  @Get('alerts')
  getAlerts() {
    return this.stockService.getAlerts();
  }

  @Get('products/:id')
  findProductById(@Param('id') id: string) {
    return this.stockService.findProductById(id);
  }

  @Post('products')
  createProduct(@Body() body: Record<string, unknown>) {
    return this.stockService.createProduct(body as never);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.stockService.updateProduct(id, body as never);
  }

  // ── Batches ───────────────────────────────────
  @Post('batches')
  createBatch(@Body() body: {
    productId: string;
    batchNumber: string;
    expiresAt: string;
    quantity: number;
    unitCost?: number;
    purchaseDate?: string;
  }) {
    return this.stockService.createBatch(body);
  }

  // ── Movements ─────────────────────────────────
  @Post('movements')
  createMovement(
    @Body() body: Record<string, unknown>,
    @CurrentUser('sub') userId: string,
  ) {
    return this.stockService.createMovement({ ...body, userId } as never);
  }
}
