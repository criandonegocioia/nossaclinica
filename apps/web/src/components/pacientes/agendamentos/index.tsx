'use client';

import { useState } from 'react';
import { Plus, Calendar, CheckCircle, X, ChevronDown, ChevronLeft, Clock, MapPin } from 'lucide-react';
import { useSchedules, useCreateSchedule, useUpdateScheduleStatusMutation, useUsers, useRooms, useProcedures } from '@/hooks/useApi';
import { InlineFormHeader, Field, EmptyState, DateBlock } from '../shared/ui';
import { SCHEDULE_STATUS_BADGE } from '../shared/types';
import type { TabComponentProps, Schedule } from '../shared/types';

// ── New Schedule Form ──────────────────────────────────────────────────────────
function NewScheduleForm({ patientId, patientName, onDone }: { patientId: string; patientName: string; onDone: () => void }) {
  const { data: usersData } = useUsers();
  const { data: roomsData }  = useRooms();
  const { data: procs = [] } = useProcedures();
  const users = (usersData as any)?.data ?? usersData ?? [];
  const rooms = (roomsData as any)?.data ?? roomsData ?? [];

  const [form, setForm] = useState({
    startAt: '', endAt: '', professionalId: '', roomId: '', procedureId: '', notes: '',
  });
  const create = useCreateSchedule();
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.startAt) return;
    await create.mutateAsync({ patientId, patientName, ...form, startAt: new Date(form.startAt).toISOString(), endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined });
    onDone();
  };

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <InlineFormHeader title="Novo Agendamento" onBack={onDone} />
        <div className="grid grid-2">
          <Field label="Início"><input className="input" type="datetime-local" value={form.startAt} onChange={(e) => set('startAt', e.target.value)} /></Field>
          <Field label="Fim"><input className="input" type="datetime-local" value={form.endAt} onChange={(e) => set('endAt', e.target.value)} /></Field>
          <Field label="Profissional">
            <select className="input" value={form.professionalId} onChange={(e) => set('professionalId', e.target.value)}>
              <option value="">Selecione...</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="Sala">
            <select className="input" value={form.roomId} onChange={(e) => set('roomId', e.target.value)}>
              <option value="">Selecione...</option>
              {rooms.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Procedimento">
            <select className="input" value={form.procedureId} onChange={(e) => set('procedureId', e.target.value)}>
              <option value="">Selecione...</option>
              {procs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Observações" span>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
          <button className="btn btn-secondary" onClick={onDone}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={create.isPending || !form.startAt}>
            {create.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : <><Calendar size={14} /> Agendar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Schedule Card ──────────────────────────────────────────────────────────────
function ScheduleCard({ appt, patientName, isExpanded, onToggle, onStatusChange }: { appt: Schedule; patientName: string; isExpanded: boolean; onToggle: () => void; onStatusChange: (id: string, status: string) => Promise<void> }) {
  const rawStatus = String(appt.status);
  const isBlock = appt.isBlock === true;
  const displayStatus = isBlock ? 'BLOQUEIO' : rawStatus === 'BLOQUEIO' ? 'AGENDADO' : rawStatus;
  const isUpcoming = !['CONCLUIDO', 'CANCELADO', 'FALTOU'].includes(displayStatus);
  const startAt = appt.startAt ? new Date(appt.startAt) : null;
  const endAt   = appt.endAt   ? new Date(appt.endAt)   : null;
  const durationMin = startAt && endAt ? Math.round((endAt.getTime() - startAt.getTime()) / 60000) : null;
  const procName = (appt.procedure as any)?.name || '';
  const rawNotes = String(appt.notes ?? '');
  const cleanNotes = rawNotes.replace(/\[OPENCLAW\]\s*/gi, '').replace(/Paciente:\s*[^,]+(,|$)/gi, '').replace(/CPF:\s*[\d.\-]+(\s|,|$)/gi, '').replace(/Email:\s*\S+(\s|,|$)/gi, '').replace(/Tel:\s*[\d+()\-\s]+(\s|,|$)/gi, '').replace(/Chat\s*ID:\s*\S+(\s|,|$)/gi, '').replace(/Lembrete:\s*[^,]+(,|$)/gi, '').replace(/Procedimento:\s*/gi, '').trim();
  const displayTitle = procName || cleanNotes || 'Consulta';
  const statusBadge  = SCHEDULE_STATUS_BADGE[displayStatus] || 'badge-warning';
  const canAct = !['CONCLUIDO', 'CANCELADO', 'FALTOU'].includes(displayStatus);
  const updateStatus = useUpdateScheduleStatusMutation();

  return (
    <div className="card" style={{ opacity: isBlock ? 0.65 : 1 }}>
      <div className="card-body">
        {!isExpanded ? (
          <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              {startAt && <DateBlock date={startAt} variant={isUpcoming ? 'primary' : 'muted'} />}
              <div>
                <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{displayTitle}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
                  {startAt?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {endAt && <> — {endAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</>}
                  {durationMin && <> · {durationMin}min</>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className={`badge badge-dot ${statusBadge}`}>{displayStatus}</span>
              <ChevronDown size={14} style={{ color: 'var(--gray-400)', transform: 'rotate(-90deg)' }} />
            </div>
          </button>
        ) : (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={onToggle}><ChevronLeft size={18} /></button>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Detalhes do Agendamento</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              <div className="avatar" style={{ width: 48, height: 48, fontSize: 'var(--text-base)' }}>{patientName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{isBlock ? 'Bloqueio' : patientName}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>{displayTitle}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Horário</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {startAt?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{durationMin ? ` · ${durationMin}min` : ''}</div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Sala</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {(appt.room as any)?.name || '—'}</div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Profissional</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>👤 {(appt.professional as any)?.name || '—'}</div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Status</div>
                <span className={`badge badge-dot ${statusBadge}`}>{displayStatus}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={async () => { await onStatusChange(appt.id, 'CONFIRMADO'); onToggle(); }} disabled={updateStatus.isPending || !canAct || displayStatus === 'CONFIRMADO'}><CheckCircle size={14} /> Confirmar</button>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error-500)' }} onClick={async () => { if (!confirm('Cancelar este agendamento?')) return; await onStatusChange(appt.id, 'CANCELADO'); onToggle(); }} disabled={updateStatus.isPending || !canAct}><X size={14} /> Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab export ─────────────────────────────────────────────────────────────────
interface AgendamentosTabProps extends TabComponentProps {
  patientName: string;
}

export default function AgendamentosTab({ patientId, patientName }: AgendamentosTabProps) {
  const { data: raw } = useSchedules({ patientId });
  const schedules: Schedule[] = (raw as any)?.data ?? raw ?? [];
  const unique: Schedule[] = Array.from(new Map(schedules.map((s) => [s.id, s])).values());

  const [showForm, setShowForm]   = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const updateStatus = useUpdateScheduleStatusMutation();

  const filtered = filter ? unique.filter((s) => {
    const st = String(s.status);
    if (filter === 'AGENDADO') return st === 'AGENDADO' || (st === 'BLOQUEIO' && s.isBlock !== true);
    return st === filter;
  }) : unique;

  if (showForm) return <NewScheduleForm patientId={patientId} patientName={patientName} onDone={() => setShowForm(false)} />;

  const STATUS_FILTERS = ['AGENDADO', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO'] as const;

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Agendamentos</h3>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
          {unique.length > 0 && (
            <>
              <button className={`btn btn-sm ${!filter ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: 11 }} onClick={() => setFilter(null)}>Todos ({unique.length})</button>
              {STATUS_FILTERS.map((f) => {
                const count = unique.filter((s) => String(s.status) === f).length;
                if (!count) return null;
                return <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: 11 }} onClick={() => setFilter(f)}>{f === 'AGENDADO' ? 'Agendado' : f === 'CONFIRMADO' ? 'Confirmado' : f === 'CONCLUIDO' ? 'Concluído' : 'Cancelado'} ({count})</button>;
              })}
            </>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> Novo Agendamento</button>
        </div>
      </div>

      {unique.length === 0 ? (
        <EmptyState icon={Calendar} message="Nenhum agendamento encontrado"
          action={<button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> Realizar Agendamento</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filtered.map((appt, i) => (
            <div key={appt.id} style={{ animation: `fadeInUp 0.2s ease backwards ${i * 50}ms` }}>
              <ScheduleCard
                appt={appt}
                patientName={patientName}
                isExpanded={expandedId === appt.id}
                onToggle={() => setExpandedId(expandedId === appt.id ? null : appt.id)}
                onStatusChange={async (id, status) => { await updateStatus.mutateAsync({ id, status }); }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
