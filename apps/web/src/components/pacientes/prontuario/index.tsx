'use client';

import { useState } from 'react';
import { Plus, FileText, ChevronDown, ChevronLeft } from 'lucide-react';
import { useMedicalRecords, useUpdateMedicalRecordStatus, useCancelMedicalRecord } from '@/hooks/useApi';
import { EmptyState, DateBlock } from '../shared/ui';
import type { TabComponentProps, MedicalRecord } from '../shared/types';
import { NovoAtendimentoForm } from './novo-atendimento/NovoAtendimentoForm';



function RecordCard({ record, isExpanded, onToggle }: { record: MedicalRecord; isExpanded: boolean; onToggle: () => void }) {
  const dateObj = record.dateTime ? new Date(record.dateTime) : record.createdAt ? new Date(record.createdAt) : null;
  const procLabel = record.procedures || 'Atendimento';
  const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  const updateStatus = useUpdateMedicalRecordStatus();
  const cancelRecord = useCancelMedicalRecord();

  const handleUpdateStatus = async (isDraft: boolean) => {
    await updateStatus.mutateAsync({
      id: record.id,
      patientId: record.patientId,
      status: 'ATIVO',
      isDraft,
    });
    setIsEditingStatus(false);
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    await cancelRecord.mutateAsync({
      id: record.id,
      patientId: record.patientId,
      reason: cancelReason,
    });
    setIsCanceling(false);
  };

  const isCanceled = record.status === 'CANCELADO';
  const displayStatus = isCanceled ? 'Cancelado' : (record.isDraft ? 'Rascunho' : 'Finalizado');
  const badgeClass = isCanceled ? 'badge-error' : (record.isDraft ? 'badge-warning' : 'badge-success');

  return (
    <div className="card">
      <div className="card-body">
        {!isExpanded ? (
          <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              {dateObj && <DateBlock date={dateObj} variant={isCanceled ? 'error' : (record.isDraft ? 'warning' : 'primary')} />}
              <div>
                <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', textDecoration: isCanceled ? 'line-through' : 'none' }}>{procLabel}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
                  {dateObj?.toLocaleDateString('pt-BR', { weekday: 'long' })}
                  {record.complaint ? ` · ${record.complaint.substring(0, 40)}${record.complaint.length > 40 ? '...' : ''}` : ''}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className={`badge badge-dot ${badgeClass}`}>{displayStatus}</span>
              <ChevronDown size={14} style={{ color: 'var(--gray-400)', transform: 'rotate(-90deg)' }} />
            </div>
          </button>
        ) : (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={onToggle}><ChevronLeft size={18} /></button>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Detalhes do Atendimento</h3>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                {isEditingStatus ? (
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <select 
                      className="input input-sm" 
                      defaultValue={record.isDraft ? 'draft' : 'final'}
                      onChange={(e) => handleUpdateStatus(e.target.value === 'draft')}
                      disabled={updateStatus.isPending}
                    >
                      <option value="draft">Rascunho</option>
                      <option value="final">Finalizado</option>
                    </select>
                    <button className="btn btn-ghost btn-sm" onClick={() => setIsEditingStatus(false)}>Fechar</button>
                  </div>
                ) : (
                  <>
                    <span className={`badge badge-dot ${badgeClass}`}>{displayStatus}</span>
                    {!isCanceled && (
                      <div className="dropdown" style={{ position: 'relative' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setIsEditingStatus(true)}>Editar</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error-600)' }} onClick={() => setIsCanceling(true)}>Cancelar</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {isCanceling && (
              <div style={{ padding: 'var(--space-4)', background: 'var(--error-50)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)', border: '1px solid var(--error-200)' }}>
                <h4 style={{ color: 'var(--error-700)', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Cancelar Atendimento</h4>
                <textarea 
                  className="input" 
                  rows={2} 
                  placeholder="Motivo do cancelamento..."
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  style={{ marginBottom: 'var(--space-3)' }}
                />
                <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setIsCanceling(false)}>Voltar</button>
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ background: 'var(--error-600)', borderColor: 'var(--error-600)', color: '#fff' }}
                    onClick={handleCancel}
                    disabled={!cancelReason.trim() || cancelRecord.isPending}
                  >
                    Confirmar Cancelamento
                  </button>
                </div>
              </div>
            )}

            {isCanceled && (
              <div style={{ padding: 'var(--space-4)', background: 'var(--error-50)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)', border: '1px solid var(--error-200)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--error-600)', textTransform: 'uppercase', marginBottom: 4 }}>Cancelado em {new Date(record.cancelledAt || '').toLocaleDateString('pt-BR')}</div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--error-700)', margin: 0 }}>Motivo: {record.cancellationReason}</p>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', padding: 'var(--space-3)', background: 'var(--primary-50)', borderRadius: 'var(--radius-lg)', opacity: isCanceled ? 0.6 : 1 }}>
              {dateObj && (
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-700)', lineHeight: 1 }}>{dateObj.getDate().toString().padStart(2, '0')}</div>
                  <div style={{ fontSize: 9, color: 'var(--primary-500)' }}>{MONTHS[dateObj.getMonth()]}</div>
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600, color: 'var(--primary-800)', fontSize: 'var(--text-sm)', textDecoration: isCanceled ? 'line-through' : 'none' }}>{procLabel}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--primary-600)' }}>{dateObj?.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', opacity: isCanceled ? 0.6 : 1 }}>
              {([
                { k: 'complaint',       label: 'Queixa Principal' },
                { k: 'diagnosis',       label: 'Diagnóstico' },
                { k: 'treatmentPlan',   label: 'Tratamento / Evolução' },
                { k: 'prescriptions',   label: 'Prescrição / Receita', pre: true },
                { k: 'orientations',    label: 'Observações / Orientações' },
                { k: 'complications',   label: 'Intercorrências' },
              ] as { k: keyof MedicalRecord; label: string; pre?: boolean }[]).map(({ k, label, pre }) =>
                record[k] ? (
                  <div key={k} style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)', margin: 0, whiteSpace: pre ? 'pre-wrap' : undefined }}>{String(record[k])}</p>
                  </div>
                ) : null
              )}
              {record.nextReturn && (
                <div style={{ padding: 'var(--space-3)', background: 'var(--success-50, #f0fdf4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--success-200, #bbf7d0)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--success-600)', textTransform: 'uppercase', marginBottom: 4 }}>Data de Retorno</div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--success-700)', margin: 0, fontWeight: 600 }}>{new Date(record.nextReturn).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProntuarioTab({ patientId }: TabComponentProps) {
  const { data: raw } = useMedicalRecords(patientId);
  const records: MedicalRecord[] = ((raw as any)?.data ?? raw ?? []).sort(
    (a: MedicalRecord, b: MedicalRecord) =>
      new Date(b.dateTime ?? b.createdAt ?? 0).getTime() - new Date(a.dateTime ?? a.createdAt ?? 0).getTime()
  );
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (showForm) return <NovoAtendimentoForm patientId={patientId} onDone={() => setShowForm(false)} />;

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Histórico de Atendimentos</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Novo Registro de Atendimento
        </button>
      </div>
      {records.length === 0 ? (
        <EmptyState icon={FileText} message="Nenhum atendimento registrado"
          action={<button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> Realizar Atendimento</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {records.map((r, i) => (
            <div key={r.id} style={{ animation: `fadeInUp 0.2s ease backwards ${i * 50}ms` }}>
              <RecordCard record={r} isExpanded={expandedId === r.id} onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
