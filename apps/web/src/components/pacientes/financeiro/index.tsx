'use client';

import { useState } from 'react';
import { Plus, DollarSign, Banknote, Smartphone, CreditCard, Building2 } from 'lucide-react';
import { useFinances, useCreateFinance, useProcedures } from '@/hooks/useApi';
import { InlineFormHeader, Field, EmptyState } from '../shared/ui';
import { PAYMENT_LABELS } from '../shared/types';
import type { TabComponentProps, Finance } from '../shared/types';

// ── Payment method icon ────────────────────────────────────────────────────────
function PaymentIcon({ method }: { method: string }) {
  const m = method?.toUpperCase();
  if (m === 'PIX') return <Smartphone size={14} />;
  if (m?.includes('CREDITO') || m?.includes('DEBITO')) return <CreditCard size={14} />;
  if (m === 'DINHEIRO') return <Banknote size={14} />;
  if (m === 'BOLETO' || m === 'TRANSFERENCIA') return <Building2 size={14} />;
  return <DollarSign size={14} />;
}

// ── New Finance Form ───────────────────────────────────────────────────────────
function NewFinanceForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const { data: procsData } = useProcedures();
  const procedures = (procsData as any)?.data ?? procsData ?? [];

  const [selectedProcs, setSelectedProcs] = useState<{ id: string; name: string; price: number }[]>([]);
  const [customDescription, setCustomDescription] = useState('');
  const [form, setForm] = useState({
    paymentMethod: 'PIX',
    status: 'PENDENTE',
    dueDate: '',
    installments: '1',
    notes: '',
  });
  const create = useCreateFinance();

  const getTotal = () => selectedProcs.reduce((s, p) => s + p.price, 0);

  const toggleProc = (proc: { id: string; name: string; price: number }) => {
    setSelectedProcs((prev) =>
      prev.some((p) => p.id === proc.id)
        ? prev.filter((p) => p.id !== proc.id)
        : [...prev, proc]
    );
  };

  const handleSave = async () => {
    const total = getTotal();
    const procNames = selectedProcs.map((p) => p.name).join(' + ');
    const desc = customDescription ? (procNames ? `${procNames} - ${customDescription}` : customDescription) : procNames;
    if (!desc || total <= 0) return;
    await create.mutateAsync({
      patientId, description: desc, amount: total,
      paymentMethod: form.paymentMethod, status: form.status,
      dueDate: form.dueDate ? new Date(form.dueDate + 'T12:00:00').toISOString() : undefined,
      totalInstallments: parseInt(form.installments, 10), installment: 1,
      notes: form.notes || undefined,
      paidAt: form.status === 'PAGO' ? new Date().toISOString() : undefined,
    });
    onDone();
  };

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <InlineFormHeader title="Novo Lançamento" onBack={onDone} />
        <div className="grid grid-2">
          {procedures.length > 0 && (
            <Field label="Procedimentos" span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-1)' }}>
                {procedures.map((p: any) => {
                  const sel = selectedProcs.some((sp) => sp.id === p.id);
                  return (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-xs)', background: sel ? 'var(--primary-50)' : 'transparent', color: sel ? 'var(--primary-700)' : 'var(--gray-600)' }}>
                      <input type="checkbox" checked={sel} onChange={() => toggleProc({ id: p.id, name: p.name, price: p.price ?? 0 })} style={{ width: 14, height: 14, accentColor: 'var(--primary-500)' }} />
                      <span style={{ flex: 1 }}>{p.name}</span>
                      {p.price > 0 && <span style={{ fontWeight: 600, color: 'var(--success-700)', fontSize: 11 }}>R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                    </label>
                  );
                })}
              </div>
            </Field>
          )}
          <Field label="Descrição adicional / manual" span>
            <input className="input" value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} placeholder="Ex: Taxa de material, desconto, ajuste..." />
          </Field>
          <Field label="Forma de pagamento">
            <select className="input" value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
              {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </Field>
          <Field label="Vencimento">
            <input className="input" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
          </Field>
          <Field label="Parcelas">
            <select className="input" value={form.installments} onChange={(e) => setForm((f) => ({ ...f, installments: e.target.value }))}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => <option key={n} value={n}>{n}x</option>)}
            </select>
          </Field>
          <Field label="Observações" span>
            <input className="input" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
        </div>
        {getTotal() > 0 && (
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--success-50, #f0fdf4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--success-200, #bbf7d0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--success-700)', fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--success-700)' }}>R$ {getTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
          <button className="btn btn-secondary" onClick={onDone}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={create.isPending || (selectedProcs.length === 0 && !customDescription)}>
            {create.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : 'Salvar Lançamento'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab export ─────────────────────────────────────────────────────────────────
export default function FinanceiroTab({ patientId }: TabComponentProps) {
  const { data: raw } = useFinances({ patientId });
  const finances: Finance[] = (raw as any)?.data ?? raw ?? [];
  const [showForm, setShowForm] = useState(false);

  const totalPago     = finances.filter((f) => f.status === 'PAGO').reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalPendente = finances.filter((f) => f.status === 'PENDENTE').reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalGeral    = finances.reduce((s, f) => s + Number(f.amount || 0), 0);

  if (showForm) return <NewFinanceForm patientId={patientId} onDone={() => setShowForm(false)} />;

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Histórico Financeiro</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> Novo Lançamento</button>
      </div>

      {finances.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          {[
            { label: 'Total Pago',   value: totalPago,     bg: 'var(--success-50, #f0fdf4)', border: 'var(--success-200, #bbf7d0)', color: 'var(--success-700)' },
            { label: 'Pendente',     value: totalPendente, bg: 'var(--warning-50, #fffbeb)', border: 'var(--warning-200, #fde68a)', color: 'var(--warning-700)' },
            { label: 'Total Geral',  value: totalGeral,    bg: 'var(--primary-50)',           border: 'var(--primary-200, #99f6e4)', color: 'var(--primary-700)' },
          ].map(({ label, value, bg, border, color }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color }}>R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
          ))}
        </div>
      )}

      {finances.length === 0 ? (
        <EmptyState icon={DollarSign} message="Nenhum lançamento financeiro"
          action={<button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> Realizar Lançamento</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {finances.map((fin, i) => (
            <div key={fin.id} className="card" style={{ animation: `fadeInUp 0.3s ease backwards ${i * 80}ms` }}>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ padding: 'var(--space-2)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', color: fin.type === 'RECEBIMENTO' ? 'var(--success-600)' : 'var(--error-600)' }}>
                    <PaymentIcon method={fin.paymentMethod || ''} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 'var(--font-semibold)', color: fin.type === 'RECEBIMENTO' ? 'var(--success-600)' : 'var(--error-600)', marginBottom: 2 }}>R$ {Number(fin.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{fin.description}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge badge-dot ${fin.status === 'PAGO' ? 'badge-success' : 'badge-warning'}`}>{fin.status}</span>
                  {fin.dueDate && <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 4 }}>Vencimento: {new Date(fin.dueDate).toLocaleDateString('pt-BR')}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
