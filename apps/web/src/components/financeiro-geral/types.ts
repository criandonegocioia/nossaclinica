import { z } from 'zod';
import { linhaDespesaSchema } from '@/shared/schemas/itemCatalogoSchema';

// ── Schema do form da Visão Clínica (Receita / Despesa) ───────────────────────
export const lancamentoGeralSchema = z.discriminatedUnion('operacao', [
  // ── RECEITA (entrada da clínica, não vinculada a paciente) ──────────────────
  z.object({
    operacao: z.literal('RECEITA'),
    descricao: z.string().min(1, 'Descrição obrigatória'),
    valor: z.coerce.number().min(0.01, 'Informe um valor válido'),
    categoriaReceita: z.enum(['SERVICO', 'ALUGUEL', 'CONVENIO', 'OUTRO']).default('SERVICO'),
    paymentMethod: z.string().default('PIX'),
    status: z.enum(['PENDENTE', 'PAGO']).default('PENDENTE'),
    dueDate: z.string().optional(),
    notes: z.string().optional(),
  }),

  // ── DESPESA (saída da clínica, vinculada ao catálogo) ──────────────────────
  z.object({
    operacao: z.literal('DESPESA'),
    fornecedor: z.string().min(1, 'Informe o fornecedor'),
    numeroNota: z.string().optional(),
    itensDespesa: z.array(linhaDespesaSchema).min(1, 'Adicione ao menos um item'),
    paymentMethod: z.string().default('PIX'),
    status: z.enum(['PENDENTE', 'PAGO']).default('PENDENTE'),
    dueDate: z.string().optional(),
    notes: z.string().optional(),
  }),
]);

export type LancamentoGeralForm = z.infer<typeof lancamentoGeralSchema>;
export type LancamentoReceita = Extract<LancamentoGeralForm, { operacao: 'RECEITA' }>;
export type LancamentoDespesa = Extract<LancamentoGeralForm, { operacao: 'DESPESA' }>;

export const PAYMENT_LABELS_GERAL: Record<string, string> = {
  PIX: 'PIX',
  CARTAO_CREDITO: 'Cartão Crédito',
  CARTAO_DEBITO: 'Cartão Débito',
  DINHEIRO: 'Dinheiro',
  BOLETO: 'Boleto',
  TRANSFERENCIA: 'Transferência',
  CHEQUE: 'Cheque',
};

export const CATEGORIAS_RECEITA: Record<string, string> = {
  SERVICO: 'Serviço avulso',
  ALUGUEL: 'Aluguel de espaço',
  CONVENIO: 'Convênio',
  OUTRO: 'Outro',
};

// Calcula total da despesa a partir das linhas
export function calcTotalDespesa(itens: LancamentoDespesa['itensDespesa']): number {
  return itens.reduce((acc, it) => acc + it.totalLinha, 0);
}
