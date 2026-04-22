'use client';

import { useState } from 'react';
import {
  DollarSign, TrendingUp, CreditCard, AlertCircle, Download,
  Filter, Plus, Eye, CheckCircle, Clock, XCircle, Banknote,
  Smartphone, Building2, ArrowUpRight, ArrowDownRight, RefreshCw, X, Printer, FileText, Save,
} from 'lucide-react';
import { useFinances, useFinanceSummary, useUpdateFinanceStatus, useCreateFinance, usePatients } from '@/hooks/useApi';

const PAYMENT_ICONS: Record<string, typeof CreditCard> = {
  PIX: Smartphone, CARTAO_CREDITO: CreditCard, CARTAO_DEBITO: CreditCard,
  DINHEIRO: Banknote, BOLETO: Building2, TRANSFERENCIA: Building2,
};

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'PIX', CARTAO_CREDITO: 'Cartão Crédito', CARTAO_DEBITO: 'Cartão Débito',
  DINHEIRO: 'Dinheiro', BOLETO: 'Boleto', TRANSFERENCIA: 'Transferência',
};

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: typeof CheckCircle }> = {
  PAGO: { label: 'Pago', badge: 'badge-success', icon: CheckCircle },
  PENDENTE: { label: 'Pendente', badge: 'badge-warning', icon: Clock },
  ATRASADO: { label: 'Atrasado', badge: 'badge-error', icon: XCircle },
  CANCELADO: { label: 'Cancelado', badge: 'badge-neutral', icon: XCircle },
};

// Mock weekly bar chart data (while real time-series endpoint pending)
const WEEKLY_BARS = [3200, 1800, 4500, 2100, 3800, 5200, 2900];
const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function FinanceiroPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showDetail, setShowDetail] = useState<Record<string, unknown> | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    patientId: '', description: '', amount: '', status: 'PENDENTE', paymentMethod: 'PIX',
    dueDate: new Date().toISOString().split('T')[0],
  });

  const { data: patientsData } = usePatients({ limit: 100 });
  const patientsList = patientsData?.data ?? [];

  const { data: financesData, isLoading, refetch } = useFinances({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: 10,
  });
  const { data: summary } = useFinanceSummary();
  const updateStatus = useUpdateFinanceStatus();
  const createFinance = useCreateFinance();

  const transactions = financesData?.data ?? [];
  const meta = financesData?.meta;

  // Filter client-side for method (API doesn't filter by payment method yet)
  const filtered = methodFilter !== 'all'
    ? transactions.filter((t: Record<string, string>) => t.paymentMethod === methodFilter)
    : transactions;

  // KPIs from API summary or computed from list as fallback
  const monthlyRevenue = summary?.monthlyRevenue ?? transactions.filter((t: Record<string, string>) => t.status === 'PAGO').reduce((s: number, t: Record<string, number>) => s + Number(t.amount), 0);
  const pendingAmount = summary?.pendingAmount ?? transactions.filter((t: Record<string, string>) => t.status === 'PENDENTE').reduce((s: number, t: Record<string, number>) => s + Number(t.amount), 0);
  const overdueCount = summary?.overdueCount ?? transactions.filter((t: Record<string, string>) => t.status === 'ATRASADO').length;
  const growthRate = summary?.growthRate ?? 0;

  const stats = [
    { title: 'Faturamento Mês', value: `R$ ${Number(monthlyRevenue).toLocaleString('pt-BR')}`, change: `${growthRate >= 0 ? '+' : ''}${growthRate}% vs mês ant.`, positive: growthRate >= 0, icon: DollarSign },
    { title: 'Recebido', value: `R$ ${Number(monthlyRevenue).toLocaleString('pt-BR')}`, change: `${summary?.monthlyTransactions ?? 0} transações`, positive: true, icon: CheckCircle },
    { title: 'A Receber', value: `R$ ${Number(pendingAmount).toLocaleString('pt-BR')}`, change: `${summary?.pendingCount ?? 0} pendentes`, positive: true, icon: Clock },
    { title: 'Atrasado', value: `${overdueCount} título(s)`, change: 'Vencidos', positive: false, icon: AlertCircle },
  ];

  const handleMarkPaid = async (id: string) => {
    setMarkingId(id);
    try {
      await updateStatus.mutateAsync({
        id,
        status: 'PAGO',
        paidAt: new Date().toISOString(),
        paymentMethod: 'PIX',
      });
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar status');
    } finally {
      setMarkingId(null);
    }
  };

  const handleCreate = async () => {
    try {
      await createFinance.mutateAsync({
        patientId: form.patientId,
        description: form.description,
        amount: parseFloat(form.amount) || 0,
        status: form.status,
        paymentMethod: form.paymentMethod,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      });
      setShowNew(false);
      setForm({ patientId: '', description: '', amount: '', status: 'PENDENTE', paymentMethod: 'PIX', dueDate: new Date().toISOString().split('T')[0] });
    } catch (e) {
      console.error(e);
      alert('Erro ao criar lançamento.');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <DollarSign size={28} style={{ color: 'var(--success-500)' }} /> Financeiro
          </h1>
          <p className="page-subtitle">Gestão de recebimentos e faturamento</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => refetch()} title="Atualizar">
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-secondary"><Download size={16} /> Exportar</button>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}><Plus size={18} /> Novo Lançamento</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="stat-card" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="stat-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <div className="stat-title">{stat.title}</div>
                  <Icon size={18} style={{ color: 'var(--gray-400)' }} />
                </div>
                <div className="stat-value" style={{ fontSize: 'var(--text-xl)' }}>{stat.value}</div>
                <div className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                  {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly chart */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Faturamento Semanal</h3>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>Últimos 7 dias</span>
        </div>
        <div className="card-body" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', height: 100 }}>
            {(summary?.revenueByDay ?? WEEKLY_BARS).map((val: number, i: number) => {
              const maxVal = Math.max(...(summary?.revenueByDay ?? WEEKLY_BARS), 100);
              const h = Math.max((val / maxVal) * 80, 4); // min height 4px
              const daysList = summary?.revenueDays ?? DAYS;
              const isToday = i === 6; // last day is today
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '9px', color: 'var(--gray-400)' }}>{val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}</span>
                  <div style={{
                    width: '100%', maxWidth: 48, height: h, borderRadius: '6px 6px 0 0',
                    background: isToday ? 'linear-gradient(180deg, var(--primary-400), var(--primary-600))' : 'linear-gradient(180deg, var(--gray-200), var(--gray-300))',
                    animation: `fadeInUp 0.4s ease backwards ${i * 60}ms`,
                  }} />
                  <span style={{ fontSize: '10px', color: 'var(--gray-500)' }}>{daysList[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card-body" style={{ padding: 'var(--space-3) var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Filter size={14} style={{ color: 'var(--gray-400)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>Status:</span>
              {['all', 'PAGO', 'PENDENTE', 'ATRASADO'].map((s) => (
                <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter(s)}>
                  {s === 'all' ? 'Todos' : STATUS_CONFIG[s]?.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>Método:</span>
              <select className="input" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} style={{ height: 32, fontSize: 'var(--text-xs)', width: 160 }}>
                <option value="all">Todos</option>
                {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}>
            <div className="spinner spinner-lg" style={{ margin: '0 auto var(--space-4)' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>Carregando lançamentos...</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th><th>Paciente</th><th>Descrição</th><th>Método</th><th>Valor</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}>
                    <DollarSign size={28} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
                    <p style={{ fontSize: 'var(--text-sm)' }}>Nenhum lançamento encontrado</p>
                  </td>
                </tr>
              ) : filtered.map((tx: Record<string, unknown>, i: number) => {
                const MethodIcon = PAYMENT_ICONS[tx.paymentMethod as string] || CreditCard;
                const status = STATUS_CONFIG[tx.status as string] || STATUS_CONFIG.PENDENTE;
                const StatusIcon = status.icon;
                return (
                  <tr key={tx.id as string} style={{ animation: `fadeInUp 0.2s ease backwards ${i * 30}ms` }}>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                      {new Date(tx.createdAt as string).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
                        {(tx.patient as Record<string, string>)?.name ?? '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>{tx.description as string || '—'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                        <MethodIcon size={14} /> {PAYMENT_LABELS[tx.paymentMethod as string] ?? '—'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>
                      R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`badge badge-dot ${status.badge}`}>
                        <StatusIcon size={10} style={{ display: 'inline', marginRight: 3 }} />{status.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        {tx.status !== 'PAGO' && (
                          <button className="btn btn-ghost btn-sm" title="Marcar como pago" disabled={markingId === tx.id as string}
                            onClick={() => handleMarkPaid(tx.id as string)}>
                            {markingId === tx.id ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <CheckCircle size={14} />}
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowDetail(tx)} title="Visualizar">
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {meta && meta.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', padding: 'var(--space-4)', borderTop: '1px solid var(--gray-75)' }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Anterior</button>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', alignSelf: 'center' }}>
              Página {meta.page} de {meta.totalPages}
            </span>
            <button className="btn btn-secondary btn-sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Próxima →</button>
          </div>
        )}
      </div>
      {showDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDetail(null)}>
          <div className="card" style={{ width: 500, maxHeight: '90vh', overflow: 'auto', animation: 'fadeInUp 0.3s ease' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
                <FileText size={18} style={{ color: 'var(--primary-500)' }} /> Detalhes da Transação
              </h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowDetail(null)}><X size={18} /></button>
            </div>
            {(() => {
              const MethodIcon = PAYMENT_ICONS[showDetail.paymentMethod as string] || CreditCard;
              const status = STATUS_CONFIG[showDetail.status as string] || STATUS_CONFIG.PENDENTE;
              const StatusIcon = status.icon;
              return (
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--gray-400)', textTransform: 'uppercase', fontWeight: 'var(--font-semibold)', marginBottom: 2 }}>ID da Transação</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>OMNI-{(showDetail.id as string).substring(0,8).toUpperCase()}</div>
                    </div>
                    <span className={`badge badge-dot ${status.badge}`}>
                      <StatusIcon size={10} style={{ display: 'inline', marginRight: 3 }} />{status.label}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 2 }}>Paciente</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{(showDetail.patient as Record<string, string>)?.name ?? '—'}</div>
                    </div>
                    <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 2 }}>Data de Emissão</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{new Date(showDetail.createdAt as string).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed var(--gray-200)', margin: 'var(--space-2) 0' }} />

                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 2 }}>Descrição</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>{showDetail.description as string || '—'}</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div style={{ width: 40, height: 40, background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                         <MethodIcon size={20} style={{ color: 'var(--gray-600)' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Método</div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{PAYMENT_LABELS[showDetail.paymentMethod as string] ?? '—'}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '10px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Valor Total</div>
                       <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--gray-900)' }}>
                         R$ {Number(showDetail.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                       </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                    <button className="btn btn-secondary" onClick={() => setShowDetail(null)}>Fechar</button>
                    <button className="btn btn-primary" onClick={() => {
                        alert('Recurso de exportação em PDF em desenvolvimento.');
                    }}>
                      <Download size={16} /> Exportar Recibo
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal: Novo Lançamento */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowNew(false)}>
          <div className="card" style={{ width: 500, animation: 'fadeInUp 0.3s ease' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Plus size={18} /> Novo Lançamento</h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              <div className="form-group">
                <label className="label">Paciente</label>
                <select className="input" value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })}>
                  <option value="">Selecione o paciente...</option>
                  {patientsList.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Descrição / Referência</label>
                <input type="text" className="input" placeholder="Ex: Consulta, Procedimento..." 
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="label">Valor (R$)</label>
                  <input type="number" className="input" placeholder="0.00" step="0.01" 
                    value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="label">Vencimento</label>
                  <input type="date" className="input" 
                    value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="PENDENTE">Pendente</option>
                    <option value="PAGO">Pago</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Método</label>
                  <select className="input" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                    {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

            </div>
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={createFinance.isPending}>
                {createFinance.isPending ? <span className="spinner spinner-sm" /> : <Save size={16} />} Salvar Lançamento
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
