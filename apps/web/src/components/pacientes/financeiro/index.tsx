'use client';

import { useState } from 'react';
import { Plus, DollarSign, Banknote, Smartphone, CreditCard, Building2, ChevronDown, ChevronLeft, Pencil, XCircle, Printer } from 'lucide-react';
import { useFinances, useUpdateFinanceStatus } from '@/hooks/useApi';
import { EmptyState } from '../shared/ui';
import { PAYMENT_LABELS } from '../shared/types';
import type { TabComponentProps, Finance } from '../shared/types';
import NovoLancamentoForm from './novo-lancamento/NovoLancamentoForm';

function PaymentIcon({ method }: { method: string }) {
  const m = method?.toUpperCase();
  if (m === 'PIX') return <Smartphone size={14} />;
  if (m?.includes('CREDITO') || m?.includes('DEBITO')) return <CreditCard size={14} />;
  if (m === 'DINHEIRO') return <Banknote size={14} />;
  if (m === 'BOLETO' || m === 'TRANSFERENCIA') return <Building2 size={14} />;
  return <DollarSign size={14} />;
}

const STATUS_BADGE: Record<string, string> = {
  PAGO: 'badge-success', CANCELADO: 'badge-error',
  ATRASADO: 'badge-error', ESTORNADO: 'badge-neutral', PENDENTE: 'badge-warning',
};

// ── Edit Panel (status only) ──────────────────────────────────────────────────
function EditPanel({ fin, onClose }: { fin: Finance; onClose: () => void }) {
  const update = useUpdateFinanceStatus();
  const [status, setStatus] = useState(fin.status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await update.mutateAsync({ id: fin.id, status,
      ...(status === 'PAGO' && !fin.paidAt ? { paidAt: new Date().toISOString() } : {}),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-4)', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
      <div className="input-group" style={{ margin: 0, flex: 1 }}>
        <label className="input-label">Novo status</label>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Finance['status'])}>
          <option value="PENDENTE">Pendente</option>
          <option value="PAGO">Pago</option>
          <option value="ATRASADO">Atrasado</option>
          <option value="ESTORNADO">Estornado</option>
        </select>
      </div>
      <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || status === fin.status}>
        {saving ? 'Salvando...' : 'Confirmar'}
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
    </div>
  );
}

// ── Cancel Panel ──────────────────────────────────────────────────────────────
function CancelPanel({ fin, onClose }: { fin: Finance; onClose: () => void }) {
  const update = useUpdateFinanceStatus();
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    if (!reason.trim()) return;
    setSaving(true);
    await update.mutateAsync({
      id: fin.id, status: 'CANCELADO',
      canceledAt: new Date(date + 'T12:00:00').toISOString(),
      cancelReason: reason.trim(),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-4)', background: 'var(--error-50, #fff1f2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--error-200, #fecdd3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--error-700, #b91c1c)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <XCircle size={14} /> Cancelar lançamento
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 'var(--space-3)' }}>
        <div className="input-group" style={{ margin: 0 }}>
          <label className="input-label">Data do cancelamento</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="input-group" style={{ margin: 0 }}>
          <label className="input-label required">Motivo do cancelamento</label>
          <input className="input" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Paciente desistiu, erro de lançamento..." />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Voltar</button>
        <button className="btn btn-sm" disabled={!reason.trim() || saving}
          style={{ background: 'var(--error-600, #dc2626)', color: '#fff', border: 'none' }}
          onClick={confirm}>
          {saving ? 'Cancelando...' : 'Confirmar cancelamento'}
        </button>
      </div>
    </div>
  );
}

// ── Finance Card ──────────────────────────────────────────────────────────────
function FinanceCard({ fin, isExpanded, onToggle }: { fin: Finance; isExpanded: boolean; onToggle: () => void }) {
  const [panel, setPanel] = useState<'none' | 'edit' | 'cancel'>('none');
  const isCanceled = fin.status === 'CANCELADO';
  const color = fin.type === 'DESPESA' ? 'var(--error-600)' : 'var(--success-600)';
  const dateStr = fin.dueDate ? new Date(fin.dueDate).toLocaleDateString('pt-BR') : '';

  const closePanel = () => setPanel('none');

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printDate = new Date().toLocaleDateString('pt-BR');
    const itemsHtml = fin.description.split('+').map(item => item.trim()).filter(Boolean).map(item => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px;">${item}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo Financeiro</title>
        <style>
          @media print { body { margin: 0; } @page { size: A4; margin: 15mm; } }
          body { font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 30px auto; color: #1a1a1a; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { font-size: 24px; color: #0d9488; margin: 0; }
          .header .info { text-align: right; font-size: 11px; color: #888; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          thead th { background: #f1f5f9; padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: left; }
          .totals { text-align: right; margin-bottom: 24px; }
          .totals .row { display: flex; justify-content: flex-end; gap: 30px; padding: 4px 12px; font-size: 14px; }
          .totals .total { font-size: 18px; font-weight: 700; color: #0d9488; border-top: 2px solid #0d9488; padding-top: 8px; margin-top: 8px; }
          .details { background: #f8fafa; padding: 12px 16px; border-radius: 8px; margin-bottom: 30px; font-size: 13px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="header">
          <div><h1>OdontoFace Clínica</h1><p style="font-size: 11px; color: #888; margin: 4px 0 0;">Recibo de Lançamento Financeiro</p></div>
          <div class="info">Impresso em:<br/>${printDate}</div>
        </div>
        
        <div class="details">
          <strong>Status:</strong> ${fin.status} ${isCanceled ? `(Cancelado em ${new Date(fin.canceledAt!).toLocaleDateString('pt-BR')} - Motivo: ${fin.cancelReason})` : ''}<br/>
          <strong>Vencimento:</strong> ${dateStr || '—'}<br/>
          <strong>Pagamento:</strong> ${PAYMENT_LABELS[fin.paymentMethod || ''] || fin.paymentMethod || '—'} 
          ${fin.paidAt ? `(Pago em ${new Date(fin.paidAt).toLocaleDateString('pt-BR')})` : ''}
        </div>

        <table>
          <thead><tr><th>Descrição dos Itens / Procedimentos</th></tr></thead>
          <tbody>${itemsHtml || `<tr><td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px;">${fin.description}</td></tr>`}</tbody>
        </table>

        <div class="totals">
          <div class="row total"><span>TOTAL:</span><span>R$ ${Number(fin.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
        </div>
        
        ${fin.notes ? `<div class="details"><strong>Observações:</strong><br/>${fin.notes}</div>` : ''}
        
        <div style="display: flex; justify-content: center; margin-top: 60px;">
          <div style="text-align: center; width: 200px;">
            <div style="border-top: 1px solid #333; margin-bottom: 4px;"></div>
            <div style="font-size: 12px;">Assinatura do Responsável</div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="card" style={{ opacity: isCanceled ? 0.7 : 1 }}>
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
                <span className={`badge badge-dot ${STATUS_BADGE[fin.status] ?? 'badge-warning'}`}>{fin.status}</span>
                {dateStr && <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 4 }}>Vcto: {dateStr}</div>}
              </div>
              <ChevronDown size={14} style={{ color: 'var(--gray-400)', transform: 'rotate(-90deg)' }} />
            </div>
          </button>
        ) : (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={onToggle}><ChevronLeft size={18} /></button>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Detalhes do Lançamento</h3>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-ghost btn-sm" onClick={handlePrint}>
                  <Printer size={13} /> Imprimir
                </button>
                {!isCanceled && (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => setPanel(panel === 'edit' ? 'none' : 'edit')}
                      style={{ color: 'var(--primary-600)' }}>
                      <Pencil size={13} /> Editar status
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setPanel(panel === 'cancel' ? 'none' : 'cancel')}
                      style={{ color: 'var(--error-600, #dc2626)' }}>
                      <XCircle size={13} /> Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Detail Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              {[
                { label: 'Valor', content: <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color }}>{`R$ ${Number(fin.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span> },
                { label: 'Status', content: <span className={`badge badge-dot ${STATUS_BADGE[fin.status] ?? 'badge-warning'}`}>{fin.status}</span> },
              ].map(({ label, content }) => (
                <div key={label} style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>{label}</div>
                  {content}
                </div>
              ))}
              <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)', gridColumn: 'span 2' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Descrição</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-800)' }}>{fin.description}</div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Forma de Pagamento</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{PAYMENT_LABELS[fin.paymentMethod || ''] || fin.paymentMethod || '—'}</div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Vencimento / Pago em</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{dateStr || '—'}{fin.paidAt ? ` / ${new Date(fin.paidAt).toLocaleDateString('pt-BR')}` : ''}</div>
              </div>
              {fin.canceledAt && (
                <div style={{ padding: 'var(--space-3)', background: 'var(--error-50, #fff1f2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--error-200, #fecdd3)', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--error-600)', marginBottom: 2, fontWeight: 600 }}>Cancelamento</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--error-800, #991b1b)' }}>
                    📅 {new Date(fin.canceledAt).toLocaleDateString('pt-BR')} — {fin.cancelReason}
                  </div>
                </div>
              )}
              {fin.notes && (
                <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Observações</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>{fin.notes}</div>
                </div>
              )}
            </div>

            {/* Inline Panels */}
            {panel === 'edit'   && <EditPanel fin={fin} onClose={closePanel} />}
            {panel === 'cancel' && <CancelPanel fin={fin} onClose={closePanel} />}
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
  const totalGeral    = finances.filter((f) => f.status !== 'CANCELADO').reduce((s, f) => s + Number(f.amount || 0), 0);

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
            { label: 'Total Geral',  value: totalGeral,    bg: 'var(--primary-50)',           border: 'var(--primary-200)',          color: 'var(--primary-700)' },
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
