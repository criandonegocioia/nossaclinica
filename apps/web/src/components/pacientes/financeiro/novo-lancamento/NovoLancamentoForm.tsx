'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateFinance } from '@/hooks/useApi';
import { InlineFormHeader } from '@/components/pacientes/shared/ui';
import { financeFormSchema, calcTotal, calcItemFinal, type FinanceFormData } from './types';
import ProcedimentosCart from './ProcedimentosCart';
import ResumoEAcoes from './ResumoEAcoes';

interface Props {
  patientId: string;
  onDone: () => void;
}

export default function NovoLancamentoForm({ patientId, onDone }: Props) {
  const [saved, setSaved] = useState(false);
  const create = useCreateFinance();

  const methods = useForm<FinanceFormData>({
    resolver: zodResolver(financeFormSchema),
    defaultValues: {
      items: [],
      customDescription: '',
      paymentMethod: 'PIX',
      status: 'PENDENTE',
      installments: 1,
      dueDate: '',
      globalDiscountType: 'NENHUM',
      globalDiscountValue: 0,
      campaignId: undefined,
      notes: '',
    },
  });

  const onSubmit = async (data: FinanceFormData) => {
    const total = calcTotal(data);
    if (total <= 0) return;

    // Reduce cart → flat payload for the backend
    const descParts = data.items.map((it) => {
      const final_ = calcItemFinal(it);
      return `${it.name} (R$ ${final_.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
    });

    const description = data.customDescription
      ? `${descParts.join(' + ')} — ${data.customDescription}`
      : descParts.join(' + ');

    await create.mutateAsync({
      patientId,
      description,
      amount: total,
      paymentMethod: data.paymentMethod,
      status: data.status,
      dueDate: data.dueDate ? new Date(data.dueDate + 'T12:00:00').toISOString() : undefined,
      totalInstallments: data.installments,
      installment: 1,
      notes: data.notes || undefined,
      paidAt: data.status === 'PAGO' ? new Date().toISOString() : undefined,
    });

    setSaved(true);
  };

  if (saved) {
    return (
      <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
        <div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <div style={{ fontSize: 48, marginBottom: 'var(--space-3)' }}>✅</div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>Lançamento Salvo!</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', marginBottom: 'var(--space-5)' }}>
            R$ {calcTotal(methods.getValues()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrado com sucesso.
          </p>
          <FormProvider {...methods}>
            <ResumoEAcoes isPending={false} saved />
          </FormProvider>
          <button className="btn btn-secondary" onClick={onDone} style={{ marginTop: 'var(--space-4)' }}>← Voltar ao Histórico</button>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
        <div className="card-body">
          <InlineFormHeader title="Novo Lançamento Financeiro" onBack={onDone} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <input className="input" {...methods.register('customDescription')}
              placeholder="Descrição adicional (opcional)" style={{ fontSize: 'var(--text-xs)' }} />
            <ProcedimentosCart />
            <ResumoEAcoes isPending={create.isPending} saved={false} />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
