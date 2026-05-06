import { z } from 'zod';

// ── Discriminated union para Produtos e Medicamentos ───────────────────────────
const baseItemSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, 'Nome obrigatório'),
  fabricante: z.string().optional(),
  unidadeMedida: z.string().default('UN'),
  precoUnitario: z.number().min(0).default(0),
  estoque: z.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
});

export const itemMaterialSchema = baseItemSchema.extend({
  tipo: z.literal('MATERIAL'),
  codigoInterno: z.string().optional(),
  categoria: z.enum(['CONSUMIVEL', 'EQUIPAMENTO', 'EPI', 'LIMPEZA', 'OUTRO']).default('CONSUMIVEL'),
});

export const itemMedicamentoSchema = baseItemSchema.extend({
  tipo: z.literal('MEDICAMENTO'),
  principioAtivo: z.string().optional(),
  concentracao: z.string().optional(),
  posologia: z.string().optional(),
  viaAdministracao: z.enum(['ORAL', 'TOPICO', 'INJETAVEL', 'INALATORIO', 'OUTRO']).optional(),
  necessitaReceita: z.boolean().default(false),
  registroAnvisa: z.string().optional(),
});

export const itemCatalogoSchema = z.discriminatedUnion('tipo', [
  itemMaterialSchema,
  itemMedicamentoSchema,
]);

// ── Linha de despesa: item + qtd + valor negociado ─────────────────────────────
export const linhaDespesaSchema = z.object({
  itemId: z.string(),
  itemNome: z.string(),
  itemTipo: z.enum(['MATERIAL', 'MEDICAMENTO']),
  quantidade: z.number().int().min(1).default(1),
  precoUnitario: z.number().min(0),
  totalLinha: z.number().min(0),
});

// ── Tipos inferidos ────────────────────────────────────────────────────────────
export type ItemCatalogo = z.infer<typeof itemCatalogoSchema>;
export type ItemMaterial = z.infer<typeof itemMaterialSchema>;
export type ItemMedicamento = z.infer<typeof itemMedicamentoSchema>;
export type LinhaDespesa = z.infer<typeof linhaDespesaSchema>;

// ── Helpers ────────────────────────────────────────────────────────────────────
export const UNIDADES_MEDIDA = ['UN', 'CX', 'FR', 'PC', 'ML', 'MG', 'G', 'KG', 'L'] as const;

export const CATEGORIAS_MATERIAL: Record<string, string> = {
  CONSUMIVEL: 'Consumível',
  EQUIPAMENTO: 'Equipamento',
  EPI: 'EPI',
  LIMPEZA: 'Limpeza',
  OUTRO: 'Outro',
};

export const VIAS_ADMINISTRACAO: Record<string, string> = {
  ORAL: 'Oral', TOPICO: 'Tópico', INJETAVEL: 'Injetável',
  INALATORIO: 'Inalatório', OUTRO: 'Outro',
};

export function calcTotalLinha(qtd: number, preco: number): number {
  return Math.round(qtd * preco * 100) / 100;
}
