'use client';

import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrendingUp, TrendingDown, Save } from 'lucide-react';
import { useCreateFinance } from '@/hooks/useApi';
import { lancamentoGeralSchema, type LancamentoGeralForm, PAYMENT_LABELS_GERAL, CATEGORIAS_RECEITA, calcTotalDespesa } from './types';
import { ItemCatalogoSelect } from './ItemCatalogoSelect';
import { Field } from '@/components/pacientes/shared/ui';

interface Props {
  onDone: () => void;
}

// ── Paleta visual por operação ──────────────────────────────────────────────────
const OPERACAO_CONFIG = {
  RECEITA: {
    label: 'Entrada (Receita)',
    icon: TrendingUp,
    ring: 'ring-emerald-300',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-200',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  DESPESA: {
    label: 'Saída (Despesa)',
    icon: TrendingDown,
    ring: 'ring-rose-300',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-700',
    border: 'border-rose-200',
    btnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
} as const;

export default function NovoLancamentoGeralForm({ onDone }: Props) {
  const create = useCreateFinance();

  const form = useForm<LancamentoGeralForm>({
    resolver: zodResolver(lancamentoGeralSchema),
    defaultValues: { operacao: 'RECEITA', descricao: '', valor: 0, categoriaReceita: 'SERVICO', paymentMethod: 'PIX', status: 'PENDENTE' },
  });

  const { register, control, handleSubmit, setValue, formState: { errors } } = form;
  const operacao = useWatch({ control, name: 'operacao' }) as 'RECEITA' | 'DESPESA';
  const itensDespesa = useWatch({ control, name: 'itensDespesa' as never }) as LancamentoGeralForm extends { itensDespesa: infer T } ? T : never[] ?? [];
  const cfg = OPERACAO_CONFIG[operacao];

  const onSubmit = async (data: LancamentoGeralForm) => {
    if (data.operacao === 'DESPESA') {
      const total = calcTotalDespesa(data.itensDespesa);
      const desc = `Despesa - ${data.fornecedor}: ${data.itensDespesa.map(i => i.itemNome).join(', ')}`;
      await create.mutateAsync({
        description: desc,
        amount: total,
        type: 'DESPESA',
        paymentMethod: data.paymentMethod,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate + 'T12:00:00').toISOString() : undefined,
        notes: data.notes,
        fornecedor: data.fornecedor,
        numeroNota: data.numeroNota,
      } as never);
    } else {
      await create.mutateAsync({
        description: data.descricao,
        amount: data.valor,
        type: 'RECEITA',
        paymentMethod: data.paymentMethod,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate + 'T12:00:00').toISOString() : undefined,
        notes: data.notes,
      } as never);
    }
    onDone();
  };

  return (
    <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-6 transition-all duration-300`}>
      {/* Toggle Receita / Despesa */}
      <div className="flex gap-2 mb-6">
        {(['RECEITA', 'DESPESA'] as const).map((op) => {
          const c = OPERACAO_CONFIG[op];
          const Icon = c.icon;
          const active = operacao === op;
          return (
            <button
              key={op}
              type="button"
              aria-pressed={active}
              onClick={() => setValue('operacao', op, { shouldValidate: true })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${active ? `${c.badge} ${c.border} shadow-sm` : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
            >
              <Icon size={16} /> {c.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* ── RECEITA ─────────────────────────────────────────────────────── */}
        {operacao === 'RECEITA' && (
          <>
            <Field label="Descrição / Referência" error={(errors as never as { descricao?: { message?: string } }).descricao?.message}>
              <input className="input" {...register('descricao')} placeholder="Ex: Aluguel sala, convênio ABC..." />
            </Field>
            <div className="grid grid-2">
              <Field label="Valor (R$)" error={(errors as never as { valor?: { message?: string } }).valor?.message}>
                <input className="input" type="number" step="0.01" min="0" {...register('valor', { valueAsNumber: true })} />
              </Field>
              <Field label="Categoria">
                <select className="input" {...register('categoriaReceita')}>
                  {Object.entries(CATEGORIAS_RECEITA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
            </div>
          </>
        )}

        {/* ── DESPESA ─────────────────────────────────────────────────────── */}
        {operacao === 'DESPESA' && (
          <>
            <div className="grid grid-2">
              <Field label="Fornecedor *" error={(errors as never as { fornecedor?: { message?: string } }).fornecedor?.message}>
                <input className="input" {...register('fornecedor')} placeholder="Ex: Dental Farma, Baumer..." />
              </Field>
              <Field label="Nº da Nota Fiscal">
                <input className="input" {...register('numeroNota')} placeholder="Opcional" />
              </Field>
            </div>
            <Field label="Itens Adquiridos *" error={(errors as never as { itensDespesa?: { message?: string } }).itensDespesa?.message}>
              <Controller
                name={'itensDespesa' as never}
                control={control}
                render={({ field }) => (
                  <ItemCatalogoSelect value={(field.value as never) ?? []} onChange={field.onChange} />
                )}
              />
            </Field>
          </>
        )}

        {/* ── Campos comuns ────────────────────────────────────────────────── */}
        <div className="grid grid-2">
          <Field label="Método de pagamento">
            <select className="input" {...register('paymentMethod')}>
              {Object.entries(PAYMENT_LABELS_GERAL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="input" {...register('status')}>
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago</option>
            </select>
          </Field>
          <Field label="Vencimento">
            <input className="input" type="date" {...register('dueDate')} />
          </Field>
          <Field label="Observações">
            <input className="input" {...register('notes')} placeholder="Opcional" />
          </Field>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" className="btn btn-secondary" onClick={onDone}>Cancelar</button>
          <button
            type="submit"
            disabled={create.isPending}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${cfg.btnClass}`}
            aria-label={`Salvar ${operacao === 'RECEITA' ? 'receita' : 'despesa'}`}
          >
            {create.isPending
              ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</>
              : <><Save size={14} /> Salvar {operacao === 'RECEITA' ? 'Receita' : 'Despesa'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
