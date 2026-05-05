'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useCreateSchedule, useUsers, useRooms, useProcedures } from '@/hooks/useApi';
import { Field, InlineFormHeader } from '@/components/pacientes/shared/ui';

export default function NewScheduleInline({ patientId, patientName, onDone }: { patientId: string; patientName: string; onDone: () => void }) {
  const { data: dbProfessionalsRes } = useUsers({ role: ['DENTISTA', 'HOF'] } as any);
  const professionals = dbProfessionalsRes?.data || [];
  const { data: roomsRes } = useRooms();
  const rooms = roomsRes?.data || [];
  const { data: procsRes } = useProcedures();
  const procedures = procsRes?.data || [];

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    duration: 60,
    procedureId: '',
    professionalId: '',
    roomId: '',
    notes: '',
  });
  const create = useCreateSchedule();
  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    if (form.procedureId && procedures.length > 0) {
      const proc = procedures.find((p: any) => p.id === form.procedureId);
      if (proc) {
        const procName = proc.name.toLowerCase();
        if (procName.includes('avaliação') || procName.includes('avaliacao')) {
          set('duration', 120);
        } else {
          set('duration', 60);
        }
      }
    }
  }, [form.procedureId, procedures]);

  const handleSave = async () => {
    if (!form.professionalId || !form.procedureId || !form.roomId) {
      alert('Selecione profissional, procedimento e sala.');
      return;
    }
    const startAt = new Date(`${form.date}T${form.time}:00`);
    const endAt = new Date(startAt.getTime() + form.duration * 60000);

    try {
      await create.mutateAsync({
        patientId,
        patientName,
        professionalId: form.professionalId,
        roomId: form.roomId,
        procedureId: form.procedureId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        notes: form.notes,
      });
      onDone();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Erro ao salvar agendamento.');
    }
  };

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <InlineFormHeader title="Novo Agendamento" onBack={onDone} />
        <div className="grid grid-2">
          <Field label="Data">
            <input className="input" type="date" min={new Date().toISOString().split('T')[0]} value={form.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Horário">
            <input className="input" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
          </Field>
          <Field label="Duração (minutos)">
            <select className="input" disabled value={form.duration} onChange={(e) => set('duration', Number(e.target.value))}>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1h</option>
              <option value={90}>1h 30m</option>
              <option value={120}>2h</option>
            </select>
          </Field>
          <Field label="Profissional">
            <select className="input" value={form.professionalId} onChange={(e) => set('professionalId', e.target.value)}>
              <option value="">Selecione...</option>
              {professionals.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Procedimento">
            <select className="input" value={form.procedureId} onChange={(e) => set('procedureId', e.target.value)}>
              <option value="">Selecione...</option>
              {procedures.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Sala">
            <select className="input" value={form.roomId} onChange={(e) => set('roomId', e.target.value)}>
              <option value="">Selecione...</option>
              {rooms.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Observações" span>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Procedimento, observações..." style={{ resize: 'vertical' }} />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
          <button className="btn btn-secondary" onClick={onDone}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={create.isPending || !form.date || !form.professionalId || !form.roomId || !form.procedureId}>
            {create.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : <><Calendar size={14} /> Criar Agendamento</>}
          </button>
        </div>
      </div>
    </div>
  );
}
