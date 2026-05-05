'use client';

import { useState } from 'react';
import { Plus, Stethoscope, CheckCircle, ExternalLink, Trash2, ChevronDown } from 'lucide-react';
import { useAnamneses, useDeleteAnamnesis } from '@/hooks/useApi';
import { EmptyState, fmtDate } from '../shared/ui';
import type { TabComponentProps, Anamnesis } from '../shared/types';

// ── Anamnesis detail viewer (read-only) ───────────────────────────────────────
function AnamnesisBody({ anamnese }: { anamnese: Anamnesis }) {
  const raw = anamnese.data || anamnese.content;
  if (!raw || typeof raw !== 'object') {
    return <div style={{ padding: 'var(--space-3)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>Sem dados detalhados.</div>;
  }

  const entries = Object.entries(raw);
  const isApiFormat = entries.length > 0 && typeof entries[0][1] === 'object' && entries[0][1] !== null && 'pergunta' in (entries[0][1] as Record<string, unknown>);

  if (isApiFormat) {
    const sorted = [...entries].sort(([a], [b]) => a.localeCompare(b));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {sorted.map(([key, val]: [string, any], i) => {
          const resp = String(val.resposta || '').toLowerCase();
          const isYes = resp === 'sim' || resp.startsWith('sim');
          const isNo  = resp === 'nao' || resp === 'não' || resp.startsWith('nao') || resp.startsWith('não');
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', background: i % 2 === 0 ? 'var(--gray-25)' : 'white', borderBottom: i < sorted.length - 1 ? '1px solid var(--gray-50)' : 'none' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)', flex: 1 }}>{val.pergunta || key.replace(/_/g, ' ').replace(/^q\d+\s*/, '')}</span>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 10px', borderRadius: 'var(--radius-full)', background: isYes ? 'var(--warning-50, #fffbeb)' : isNo ? 'var(--success-50, #f0fdf4)' : 'var(--gray-100)', color: isYes ? 'var(--warning-700, #a16207)' : isNo ? 'var(--success-700, #15803d)' : 'var(--gray-700)' }}>{String(val.resposta || '—')}</span>
            </div>
          );
        })}
      </div>
    );
  }

  const LABELS: Record<string, string> = { cardiopatia: 'Cardiopatia', hipertensao: 'Hipertensão', diabetes: 'Diabetes', hepatite: 'Hepatite', hiv: 'HIV', gravidez: 'Gravidez', anemia: 'Anemia', hemorragia: 'Hemorragias', convulsao: 'Convulsões', rinite: 'Rinite/Sinusite', asma: 'Asma', febre_reumatica: 'Febre Reumática', pressao: 'Pressão Arterial', tipo_sanguineo: 'Tipo Sanguíneo', idade: 'Idade', alergias: 'Alergias', medicamentos: 'Medicamentos', anticoagulante: 'Anticoagulante', suplementos: 'Suplementos', tabagismo: 'Tabagismo', etilismo: 'Etilismo', bruxismo: 'Bruxismo', respiracao: 'Respiração', observacoes: 'Observações' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {entries.filter(([k]) => !k.endsWith('_detail')).map(([key, val], i) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', background: i % 2 === 0 ? 'var(--gray-25)' : 'white', borderBottom: '1px solid var(--gray-50)' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)', flex: 1 }}>{LABELS[key] || key.replace(/_/g, ' ')}</span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 10px', borderRadius: 'var(--radius-full)', background: val === true ? 'var(--warning-50, #fffbeb)' : val === false ? 'var(--success-50, #f0fdf4)' : 'var(--gray-100)', color: val === true ? 'var(--warning-700, #a16207)' : val === false ? 'var(--success-700, #15803d)' : 'var(--gray-700)' }}>
            {val === true ? 'Sim' : val === false ? 'Não' : String(val || '—')}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Tab export ─────────────────────────────────────────────────────────────────
interface AnamneseTabProps extends TabComponentProps {
  onNew: () => void;
  onEdit: (anamnese: Anamnesis) => void;
}

export default function AnamneseTab({ patientId, onNew, onEdit }: AnamneseTabProps) {
  const { data: raw } = useAnamneses(patientId);
  const anamneses: Anamnesis[] = ((raw as any)?.data ?? raw ?? []).sort(
    (a: Anamnesis, b: Anamnesis) => new Date(b.filledAt ?? b.createdAt ?? 0).getTime() - new Date(a.filledAt ?? a.createdAt ?? 0).getTime()
  );
  const deleteAnamnesis = useDeleteAnamnesis();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setCollapsed((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Ficha de Anamnese</h3>
        <button className="btn btn-primary btn-sm" onClick={onNew}><Plus size={14} /> Nova Anamnese</button>
      </div>

      {anamneses.length === 0 ? (
        <EmptyState icon={Stethoscope} message="Nenhuma anamnese registrada"
          action={<button className="btn btn-primary btn-sm" onClick={onNew}><Plus size={14} /> Realizar Anamnese</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {anamneses.map((anamnese, index) => {
            const isCollapsed = collapsed.has(anamnese.id);
            return (
              <div key={anamnese.id} className="card" style={{ animation: `fadeInUp 0.3s ease backwards ${index * 80}ms` }}>
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button onClick={() => toggle(anamnese.id)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flex: 1, textAlign: 'left' }}>
                      <CheckCircle size={16} style={{ color: 'var(--success-500)', flexShrink: 0 }} />
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-900)', fontWeight: 'var(--font-medium)' }}>
                        Preenchida em: {fmtDate(String(anamnese.filledAt ?? anamnese.createdAt ?? ''))}
                      </span>
                      <ChevronDown size={14} style={{ color: 'var(--gray-400)', marginLeft: 'var(--space-1)', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                      {anamnese.status && <span className={`badge badge-dot ${anamnese.status === 'PREENCHIDA' ? 'badge-success' : 'badge-warning'}`}>{anamnese.status}</span>}
                      <button className="btn btn-ghost btn-sm btn-icon" title={anamnese.status === 'RASCUNHO' ? 'Editar rascunho' : 'Ver / Editar'} onClick={() => onEdit(anamnese)}>
                        {anamnese.status === 'RASCUNHO' ? <ExternalLink size={14} /> : <ExternalLink size={14} />}
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Excluir" onClick={async () => { if (!confirm('Excluir esta anamnese permanentemente?')) return; await deleteAnamnesis.mutateAsync({ id: anamnese.id, patientId }); }} style={{ color: 'var(--error-500)' }} disabled={deleteAnamnesis.isPending}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {!isCollapsed && (
                    <div style={{ marginTop: 'var(--space-3)' }}>
                      <AnamnesisBody anamnese={anamnese} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
