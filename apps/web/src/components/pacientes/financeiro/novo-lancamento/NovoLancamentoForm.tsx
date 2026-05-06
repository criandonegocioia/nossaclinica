'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateFinance } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/auth';
import { InlineFormHeader } from '@/components/pacientes/shared/ui';
import { financeFormSchema, calcTotal, calcItemFinal, type FinanceFormData } from './types';
import ProcedimentosCart from './ProcedimentosCart';
import ResumoEAcoes from './ResumoEAcoes';
import { ReciboModal } from './ReciboModal';
import type { DadosRecibo } from '@/shared/utils/gerarTextoRecibo';

interface Props {
  patientId: string;
  patientName?: string;
  onDone: () => void;
}

export default function NovoLancamentoForm({ patientId, patientName, onDone }: Props) {
  const [reciboData, setReciboData] = useState<{ dados: DadosRecibo; total: number } | null>(null);
  const create = useCreateFinance();
  const { user } = useAuthStore();

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
      type: 'RECEITA',
      paymentMethod: data.paymentMethod,
      status: data.status,
      dueDate: data.dueDate ? new Date(data.dueDate + 'T12:00:00').toISOString() : undefined,
      totalInstallments: data.installments,
      installment: 1,
      notes: data.notes || undefined,
      paidAt: data.status === 'PAGO' ? new Date().toISOString() : undefined,
    });

    setReciboData({
      total,
      dados: {
        pacienteNome: patientName ?? 'Paciente',
        profissionalNome: user?.name,
        clinicaNome: 'Nossa Clínica',
        form: data,
        dataEmissao: new Date(),
      },
    });
  };

  return (
    <>
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="card"
          style={{ animation: 'fadeInUp 0.25s ease' }}
        >
          <div className="card-body">
            <InlineFormHeader title="Novo Lançamento Financeiro" onBack={onDone} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <input
                className="input"
                {...methods.register('customDescription')}
                placeholder="Descrição adicional (opcional)"
                style={{ fontSize: 'var(--text-xs)' }}
              />
              <ProcedimentosCart />
              <ResumoEAcoes isPending={create.isPending} saved={false} />
            </div>
          </div>
        </form>
      </FormProvider>

      {reciboData && (
        <ReciboModal
          dados={reciboData.dados}
          total={reciboData.total}
          onClose={onDone}
        />
      )}
    </>
  );
}
