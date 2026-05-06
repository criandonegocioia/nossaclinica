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

const OPERACAO_CONFIG = {
  RECEITA: {
    label: 'Entrada (Receita)',
    icon: TrendingUp,
    bg: 'var(--success-50)',
    text: 'var(--success-600)',
    border: 'var(--success-500)',
    btnClass: 'btn btn-primary',
  },
  DESPESA: {
    label: 'Saída (Despesa)',
    icon: TrendingDown,
    bg: 'var(--error-50)',
    text: 'var(--error-600)',
    border: 'var(--error-500)',
    btnClass: 'btn btn-primary',
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
    <div className="card" style={{ padding: 'var(--space-6)', borderTop: `4px solid ${cfg.border}`, background: 'var(--white)' }}>
      {/* Toggle Receita / Despesa */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
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
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                border: active ? `2px solid ${c.border}` : '2px solid var(--gray-200)',
                background: active ? c.bg : 'var(--white)',
                color: active ? c.text : 'var(--gray-500)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} /> {c.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--gray-100)' }}>
          <button type="button" className="btn btn-secondary" onClick={onDone}>Cancelar</button>
          <button
            type="submit"
            disabled={create.isPending}
            className={cfg.btnClass}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            aria-label={`Salvar ${operacao === 'RECEITA' ? 'receita' : 'despesa'}`}
          >
            {create.isPending
              ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</>
              : <><Save size={16} /> Salvar {operacao === 'RECEITA' ? 'Receita' : 'Despesa'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
