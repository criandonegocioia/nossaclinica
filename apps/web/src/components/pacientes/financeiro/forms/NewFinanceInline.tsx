'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { useCreateFinance } from '@/hooks/useApi';
import { Field, InlineFormHeader } from '@/components/pacientes/shared/ui';
import { ProcedurePrice, INITIAL_PROCEDURE_PRICES } from '@/components/pacientes/shared/constants';

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'PIX', CARTAO_CREDITO: 'Cartão Crédito', CARTAO_DEBITO: 'Cartão Débito',
  DINHEIRO: 'Dinheiro', BOLETO: 'Boleto', TRANSFERENCIA: 'Transferência',
};

export default function NewFinanceInline({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [form, setForm] = useState({
    paymentMethod: 'PIX', status: 'PENDENTE',
    dueDate: '', installments: '1', notes: '',
  });

  const [selectedProcs, setSelectedProcs] = useState<ProcedurePrice[]>([]);
  const [discountType, setDiscountType] = useState<'NENHUM' | 'PERCENTUAL' | 'FIXO'>('NENHUM');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [customDescription, setCustomDescription] = useState('');

  const create = useCreateFinance();
  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const activePrices = INITIAL_PROCEDURE_PRICES.filter(p => p.status === 'ATIVO');

  const handleToggleProc = (proc: ProcedurePrice) => {
    setSelectedProcs(prev => 
      prev.some(p => p.id === proc.id) ? prev.filter(p => p.id !== proc.id) : [...prev, proc]
    );
  };

  const getSubtotal = () => selectedProcs.reduce((acc, p) => acc + p.price, 0);
  const getDiscountAmount = () => {
    const sub = getSubtotal();
    if (discountType === 'PERCENTUAL') return sub * (discountValue / 100);
    if (discountType === 'FIXO') return discountValue;
    return 0;
  };
  const getTotal = () => Math.max(0, getSubtotal() - getDiscountAmount());

  const handleSave = async () => {
    const total = getTotal();
    const procNames = selectedProcs.map(p => `${p.name} (R$ ${p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`).join(' + ');
    const desc = customDescription 
      ? (procNames ? `${procNames} - ${customDescription}` : customDescription)
      : procNames;
      
    if (!desc || total <= 0) return;

    await create.mutateAsync({
      patientId,
      description: desc,
      amount: total,
      paymentMethod: form.paymentMethod,
      status: form.status,
      dueDate: form.dueDate ? new Date(form.dueDate + 'T12:00:00').toISOString() : undefined,
      totalInstallments: parseInt(form.installments, 10),
      installment: 1,
      notes: form.notes || undefined,
      paidAt: form.status === 'PAGO' ? new Date().toISOString() : undefined,
    });
    onDone();
  };

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <InlineFormHeader title="Novo Lançamento Financeiro" onBack={onDone} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Field label="Selecione os procedimentos para cobrança" span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-1)', maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--gray-200)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
              {activePrices.map((proc) => {
                const selected = selectedProcs.some((p) => p.id === proc.id);
                return (
                  <label key={proc.id} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', fontSize: 'var(--text-xs)',
                    background: selected ? 'var(--primary-50)' : 'transparent',
                    color: selected ? 'var(--primary-700)' : 'var(--gray-600)',
                    transition: 'all 0.1s ease',
                  }}>
                    <input type="checkbox" checked={selected} onChange={() => handleToggleProc(proc)}
                      style={{ width: 14, height: 14, accentColor: 'var(--primary-500)' }} />
                    <span style={{ flex: 1 }}>{proc.name}</span>
                    <span style={{ fontWeight: 600, color: 'var(--success-700)', fontSize: '11px' }}>
                      R$ {proc.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </label>
                );
              })}
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <input className="input" style={{ fontSize: 'var(--text-xs)' }} value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} placeholder="Descrição adicional ou procedimentos customizados... (opcional)" />
            </div>
          </Field>

          <div style={{ display: 'flex', background: 'var(--gray-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', gap: 'var(--space-4)', alignItems: 'center' }}>
             <div style={{ flex: 1 }}>
               <div style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Subtotal</div>
               <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--gray-700)' }}>R$ {getSubtotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
             </div>
             
             <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', borderLeft: '1px solid var(--gray-200)', paddingLeft: 'var(--space-4)' }}>
               <Field label="Desconto">
                 <div style={{ display: 'flex', gap: '1px', background: 'var(--gray-200)', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <select className="input" style={{ width: 90, border: 'none', borderRadius: 0, height: 32, fontSize: '12px' }} value={discountType} onChange={(e) => { setDiscountType(e.target.value as any); if (e.target.value === 'NENHUM') setDiscountValue(0); }}>
                      <option value="NENHUM">Nenhum</option>
                      <option value="PERCENTUAL">% Perc.</option>
                      <option value="FIXO">R$ Fixo</option>
                    </select>
                    <input className="input" type="number" min="0" step="0.01" style={{ width: 80, border: 'none', borderRadius: 0, height: 32, fontSize: '12px' }} disabled={discountType === 'NENHUM'} value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} />
                 </div>
               </Field>
             </div>

             <div style={{ paddingLeft: 'var(--space-4)', borderLeft: '1px solid var(--gray-200)', minWidth: 120 }}>
               <div style={{ fontSize: '11px', color: 'var(--primary-600)', fontWeight: 600, textTransform: 'uppercase' }}>Total a Pagar</div>
               <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--primary-700)' }}>R$ {getTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
             </div>
          </div>

          <div className="grid grid-2">
            <Field label="Método de pagamento">
              <select className="input" value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>
                {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="PENDENTE">Pendente</option>
                <option value="PAGO">Pago</option>
              </select>
            </Field>
            <Field label="Parcelas">
              <input className="input" type="number" min="1" max="24" value={form.installments} onChange={(e) => set('installments', e.target.value)} />
            </Field>
            <Field label="Data de vencimento">
              <input className="input" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </Field>
            <Field label="Observações" span>
              <input className="input" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Observações opcionais" />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
          <button className="btn btn-secondary" onClick={onDone}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={create.isPending || (!selectedProcs.length && !customDescription) || getTotal() <= 0}>
            {create.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : <><Save size={14} /> Salvar Lançamento</>}
          </button>
        </div>
      </div>
    </div>
  );
}
