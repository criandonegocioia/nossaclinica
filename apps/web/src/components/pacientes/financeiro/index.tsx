'use client';

import { useState } from 'react';
import { Plus, DollarSign, Banknote, Smartphone, CreditCard, Building2, ChevronDown, ChevronLeft, CheckCircle } from 'lucide-react';
import { useFinances } from '@/hooks/useApi';
import { EmptyState } from '../shared/ui';
import { PAYMENT_LABELS } from '../shared/types';
import type { TabComponentProps, Finance } from '../shared/types';
import NovoLancamentoForm from './novo-lancamento/NovoLancamentoForm';

// ── Payment method icon ────────────────────────────────────────────────────────
function PaymentIcon({ method }: { method: string }) {
  const m = method?.toUpperCase();
  if (m === 'PIX') return <Smartphone size={14} />;
  if (m?.includes('CREDITO') || m?.includes('DEBITO')) return <CreditCard size={14} />;
  if (m === 'DINHEIRO') return <Banknote size={14} />;
  if (m === 'BOLETO' || m === 'TRANSFERENCIA') return <Building2 size={14} />;
  return <DollarSign size={14} />;
}

// ── Finance Card ──────────────────────────────────────────────────────────────
function FinanceCard({ fin, isExpanded, onToggle }: { fin: Finance; isExpanded: boolean; onToggle: () => void }) {
  const isReceived = fin.type === 'RECEBIMENTO' || !fin.type; // default to recebimento Se estiver faltando
  const color = isReceived ? 'var(--success-600)' : 'var(--error-600)';
  const dateStr = fin.dueDate ? new Date(fin.dueDate).toLocaleDateString('pt-BR') : '';
  const statusBadge = fin.status === 'PAGO' ? 'badge-success' : fin.status === 'CANCELADO' ? 'badge-secondary' : 'badge-warning';

  return (
    <div className="card" style={{ opacity: fin.status === 'CANCELADO' ? 0.65 : 1 }}>
      <div className="card-body">
        {!isExpanded ? (
          <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-2)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', color }}>
                <PaymentIcon method={fin.paymentMethod || ''} />
              </div>
              <div>
                <div style={{ fontWeight: 'var(--font-semibold)', color, marginBottom: 2 }}>R$ {Number(fin.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{fin.description}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge badge-dot ${statusBadge}`}>{fin.status}</span>
                {dateStr && <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 4 }}>Vencimento: {dateStr}</div>}
              </div>
              <ChevronDown size={14} style={{ color: 'var(--gray-400)', transform: 'rotate(-90deg)' }} />
            </div>
          </button>
        ) : (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={onToggle}><ChevronLeft size={18} /></button>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Detalhes do Lançamento</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Valor</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color }}>R$ {Number(fin.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Status</div>
                <span className={`badge badge-dot ${statusBadge}`}>{fin.status}</span>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)', gridColumn: 'span 2' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Descrição</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-800)' }}>{fin.description}</div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Forma de Pagamento</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{PAYMENT_LABELS[fin.paymentMethod || ''] || fin.paymentMethod}</div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Vencimento / Pago em</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{dateStr || '—'} {fin.paidAt ? ` / ${new Date(fin.paidAt).toLocaleDateString('pt-BR')}` : ''}</div>
              </div>
              {fin.notes && (
                <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Observações</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>{fin.notes}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab export ─────────────────────────────────────────────────────────────────
export default function FinanceiroTab({ patientId }: TabComponentProps) {
  const { data: raw } = useFinances({ patientId });
  const finances: Finance[] = (raw as any)?.data ?? raw ?? [];
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPago     = finances.filter((f) => f.status === 'PAGO').reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalPendente = finances.filter((f) => f.status === 'PENDENTE').reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalGeral    = finances.reduce((s, f) => s + Number(f.amount || 0), 0);

  if (showForm) return <NovoLancamentoForm patientId={patientId} onDone={() => setShowForm(false)} />;

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
          {finances.map((fin) => (
            <FinanceCard 
              key={fin.id} 
              fin={fin} 
              isExpanded={expandedId === fin.id}
              onToggle={() => setExpandedId(expandedId === fin.id ? null : fin.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
