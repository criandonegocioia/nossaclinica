import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { z } from 'zod';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const CreateFinanceSchema = z.object({
  patientId: z.string().min(1, 'patientId é obrigatório'),
  treatmentPlanId: z.string().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser maior que zero'),
  status: z.enum(['PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO', 'ESTORNADO']).default('PENDENTE'),
  dueDate: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional(),
  paymentMethod: z.enum([
    'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX',
    'TRANSFERENCIA', 'BOLETO', 'CONVENIO', 'OUTRO',
  ]).optional(),
  installment: z.number().int().min(1).optional(),
  totalInstallments: z.number().int().min(1).optional(),
  notes: z.string().optional(),
});
type CreateFinanceDto = z.infer<typeof CreateFinanceSchema>;

const UpdateStatusSchema = z.object({
  status: z.enum(['PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO', 'ESTORNADO']),
  paidAt: z.string().datetime().optional(),
  paymentMethod: z.enum([
    'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX',
    'TRANSFERENCIA', 'BOLETO', 'CONVENIO', 'OUTRO',
  ]).optional(),
});
type UpdateStatusDto = z.infer<typeof UpdateStatusSchema>;

@Controller('finances')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get()
  @Roles('ADMIN', 'FINANCEIRO', 'RECEPCAO')
  findAll(
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.financeService.findAll({
      patientId, status, startDate, endDate,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('summary')
  @Roles('ADMIN', 'FINANCEIRO')
  getSummary() {
    return this.financeService.getSummary();
  }

  @Post()
  @Roles('ADMIN', 'FINANCEIRO')
  create(@Body(new ZodValidationPipe(CreateFinanceSchema)) body: CreateFinanceDto) {
    return this.financeService.create(body);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'FINANCEIRO')
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateStatusSchema)) body: UpdateStatusDto,
  ) {
    return this.financeService.updateStatus(id, body as { status: string; paidAt?: string; paymentMethod?: string });
  }
}

