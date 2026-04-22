'use client';

import { useState } from 'react';
import {
  ShieldCheck, Search, Download, Clock, User, Database, ChevronDown, RefreshCw,
} from 'lucide-react';
import { useAuditLogs } from '@/hooks/useApi';

const ACTION_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  CREATE:   { label: 'Criação',      badge: 'badge-success', color: 'var(--success-500)' },
  UPDATE:   { label: 'Atualização',  badge: 'badge-warning', color: 'var(--warning-500)' },
  DELETE:   { label: 'Exclusão',     badge: 'badge-error',   color: 'var(--error-500)' },
  LOGIN:    { label: 'Login',        badge: 'badge-primary', color: 'var(--primary-500)' },
  FINALIZE: { label: 'Finalização',  badge: 'badge-neutral', color: 'var(--gray-500)' },
  LOGOUT:   { label: 'Logout',       badge: 'badge-neutral', color: 'var(--gray-400)' },
  VIEW:     { label: 'Visualização', badge: 'badge-neutral', color: 'var(--gray-400)' },
};

const ENTITY_LABELS: Record<string, string> = {
  Patient: 'Paciente', Schedule: 'Agendamento', MedicalRecord: 'Prontuário',
  HofRecord: 'Ficha HOF', Photo: 'Foto', Finance: 'Financeiro',
  Document: 'Documento', Auth: 'Autenticação', Anamnesis: 'Anamnese',
  Lead: 'Lead', Product: 'Estoque', Medication: 'Medicamento',
};

type AuditLog = {
  id: string;
  userId?: string;
  user?: { name: string; email: string };
  action: string;
  entityType: string;
  entityId: string;
  newValue?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
};

export default function AuditoriaPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useAuditLogs({
    action: actionFilter || undefined,
    page,
    limit: 10,
  });

  const logs: AuditLog[] = data?.data ?? [];
  const meta = data?.meta;

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (l.user?.name ?? '').toLowerCase().includes(q) ||
      (l.user?.email ?? '').toLowerCase().includes(q) ||
      l.entityType.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q)
    );
  });

  // Counts by action
  const counts = logs.reduce((acc, l) => {
    acc[l.action] = (acc[l.action] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <ShieldCheck size={24} style={{ color: 'var(--primary-500)' }} /> Auditoria
          </h1>
          <p className="page-subtitle">Registro completo de todas as ações do sistema</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => refetch()} title="Atualizar">
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-secondary"><Download size={16} /> Exportar</button>
        </div>
      </div>

      {/* Action counters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        {Object.entries(ACTION_CONFIG).map(([action, cfg]) => (
          counts[action] ? (
            <button
              key={action}
              onClick={() => setActionFilter(actionFilter === action ? '' : action)}
              style={{
                padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)',
                border: `1px solid ${actionFilter === action ? cfg.color : 'var(--gray-100)'}`,
                background: actionFilter === action ? cfg.color + '18' : 'white',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', transition: 'all 0.15s ease',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
              {cfg.label}
              <span style={{ background: 'var(--gray-100)', borderRadius: 99, padding: '0 6px', fontSize: '10px' }}>
                {counts[action]}
              </span>
            </button>
          ) : null
        ))}
        {actionFilter && (
          <button onClick={() => setActionFilter('')} className="btn btn-ghost btn-sm">
            Limpar filtro ×
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-5)' }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
        <input
          className="input"
          placeholder="Buscar por usuário, entidade ou ação..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
      </div>

      {/* Logs */}
      <div className="card">
        {isLoading ? (
          <div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}>
            <div className="spinner spinner-lg" style={{ margin: '0 auto var(--space-4)' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>Carregando logs de auditoria...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}>
            <ShieldCheck size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>Nenhum log encontrado</p>
          </div>
        ) : (
          <div style={{ padding: 'var(--space-2)' }}>
            {filtered.map((log, i) => {
              const cfg = ACTION_CONFIG[log.action] ?? { label: log.action, badge: 'badge-neutral', color: 'var(--gray-400)' };
              const isExpanded = expandedId === log.id;
              const entity = ENTITY_LABELS[log.entityType] ?? log.entityType;
              const userName = log.user?.name ?? log.user?.email ?? log.userId ?? 'Sistema';
              const userInitials = userName.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() || 'S';

              return (
                <div
                  key={log.id}
                  style={{
                    borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-75)',
                    marginBottom: 'var(--space-2)', overflow: 'hidden',
                    animation: `fadeInUp 0.2s ease backwards ${i * 20}ms`,
                    transition: 'box-shadow 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)', cursor: 'pointer',
                      background: isExpanded ? 'var(--gray-25)' : 'white',
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    {/* User avatar */}
                    <div className="avatar avatar-sm" style={{ fontSize: '10px', flexShrink: 0 }}>{userInitials}</div>

                    {/* Action badge */}
                    <span className={`badge ${cfg.badge}`} style={{ flexShrink: 0, fontSize: '10px' }}>{cfg.label}</span>

                    {/* Detail */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--gray-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {userName}
                        <span style={{ color: 'var(--gray-400)', fontWeight: 'normal' }}> → </span>
                        {entity}
                        {log.entityId && log.entityId !== '—' && (
                          <span style={{ fontSize: '10px', color: 'var(--gray-400)', marginLeft: 6, fontFamily: 'monospace' }}>
                            #{log.entityId.slice(-6)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                      {log.ip && (
                        <span style={{ fontSize: '10px', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Database size={10} /> {log.ip}
                        </span>
                      )}
                      <span style={{ fontSize: '10px', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
                        <Clock size={10} /> {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </span>
                      <ChevronDown size={14} style={{ color: 'var(--gray-300)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && log.newValue && (
                    <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-4)', background: 'var(--gray-25)', borderTop: '1px solid var(--gray-100)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--gray-400)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', textTransform: 'uppercase' }}>
                        Dados alterados
                      </div>
                      <pre style={{ fontSize: '11px', color: 'var(--gray-700)', background: 'white', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', overflow: 'auto', maxHeight: 200, margin: 0 }}>
                        {JSON.stringify(log.newValue, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
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
    </>
  );
}
