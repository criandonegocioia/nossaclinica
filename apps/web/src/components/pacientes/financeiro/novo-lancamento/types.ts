import { z } from 'zod';

// ── Cart item schema ───────────────────────────────────────────────────────────
export const cartItemSchema = z.object({
  procId: z.string(),
  code: z.string(),
  name: z.string(),
  basePrice: z.number().min(0),
  discountType: z.enum(['NENHUM', 'PERCENTUAL', 'FIXO']).default('NENHUM'),
  discountValue: z.number().min(0).default(0),
});

// ── Form schema ────────────────────────────────────────────────────────────────
export const financeFormSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Selecione ao menos um procedimento'),
  customDescription: z.string().optional(),
  paymentMethod: z.string().default('PIX'),
  status: z.enum(['PENDENTE', 'PAGO']).default('PENDENTE'),
  installments: z.coerce.number().int().min(1).max(24).default(1),
  dueDate: z.string().optional(),
  globalDiscountType: z.enum(['NENHUM', 'PERCENTUAL', 'FIXO']).default('NENHUM'),
  globalDiscountValue: z.coerce.number().min(0).default(0),
  campaignId: z.string().optional(),
  notes: z.string().optional(),
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type FinanceFormData = z.infer<typeof financeFormSchema>;

// ── Derived calculation helpers ────────────────────────────────────────────────
export function calcItemDiscount(item: CartItem): number {
  if (item.discountType === 'PERCENTUAL') return item.basePrice * (item.discountValue / 100);
  if (item.discountType === 'FIXO') return Math.min(item.discountValue, item.basePrice);
  return 0;
}

export function calcItemFinal(item: CartItem): number {
  return Math.max(0, item.basePrice - calcItemDiscount(item));
}

export function calcSubtotal(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + calcItemFinal(item), 0);
}

export function calcGlobalDiscount(
  subtotal: number,
  type: FinanceFormData['globalDiscountType'],
  value: number,
): number {
  if (type === 'PERCENTUAL') return subtotal * (value / 100);
  if (type === 'FIXO') return Math.min(value, subtotal);
  return 0;
}

export function calcTotal(form: FinanceFormData): number {
  const sub = calcSubtotal(form.items);
  return Math.max(0, sub - calcGlobalDiscount(sub, form.globalDiscountType, form.globalDiscountValue));
}

export const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'PIX',
  CARTAO_CREDITO: 'Cartão Crédito',
  CARTAO_DEBITO: 'Cartão Débito',
  DINHEIRO: 'Dinheiro',
  BOLETO: 'Boleto',
  TRANSFERENCIA: 'Transferência',
  CONVENIO: 'Convênio',
};
