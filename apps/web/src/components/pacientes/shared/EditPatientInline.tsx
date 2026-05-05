'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { useUpdatePatient } from '@/hooks/useApi';
import { Field } from '@/components/pacientes/shared/ui';

const GENDER_LABEL: Record<string, string> = {
  MASCULINO: 'Masculino', FEMININO: 'Feminino',
  OUTRO: 'Outro', NAO_INFORMADO: 'Não informado',
};

export interface EditPatientInlineProps {
  patient: Record<string, unknown>;
  onDone: () => void;
}

export default function EditPatientInline({ patient, onDone }: EditPatientInlineProps) {
  const [form, setForm] = useState({
    name: String(patient.name ?? ''),
    phoneMain: String(patient.phoneMain ?? ''),
    whatsapp: String(patient.whatsapp ?? ''),
    email: String(patient.email ?? ''),
    cpf: String(patient.cpf ?? ''),
    birthDate: patient.birthDate ? String(patient.birthDate).slice(0, 10) : '',
    gender: String(patient.gender ?? 'NAO_INFORMADO'),
    address: String(patient.address ?? ''),
    city: String(patient.city ?? ''),
    state: String(patient.state ?? ''),
    healthInsurance: String(patient.healthInsurance ?? ''),
    origin: String(patient.origin ?? ''),
    profession: String(patient.profession ?? ''),
    notes: String(patient.notes ?? ''),
  });

  const update = useUpdatePatient(String(patient.id));
  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    await update.mutateAsync(form);
    onDone();
  };

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Editar Dados do Paciente</h3>
        <button className="btn btn-ghost btn-sm" onClick={onDone}><X size={14} /> Cancelar</button>
      </div>
      <div className="card-body">
        <div className="grid grid-2">
          <Field label="Nome completo" span><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="CPF"><input className="input" value={form.cpf} onChange={(e) => set('cpf', e.target.value)} /></Field>
          <Field label="Data de nascimento"><input className="input" type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} /></Field>
          <Field label="Gênero">
            <select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              {Object.entries(GENDER_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Profissão"><input className="input" value={form.profession} onChange={(e) => set('profession', e.target.value)} /></Field>
          <Field label="Telefone principal"><input className="input" type="tel" value={form.phoneMain} onChange={(e) => set('phoneMain', e.target.value)} /></Field>
          <Field label="WhatsApp"><input className="input" type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /></Field>
          <Field label="E-mail" span><input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Endereço" span><input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
          <Field label="Cidade"><input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
          <Field label="Estado (UF)"><input className="input" value={form.state} onChange={(e) => set('state', e.target.value)} /></Field>
          <Field label="Convênio"><input className="input" value={form.healthInsurance} onChange={(e) => set('healthInsurance', e.target.value)} /></Field>
          <Field label="Origem / Canal"><input className="input" value={form.origin} onChange={(e) => set('origin', e.target.value)} /></Field>
          <Field label="Observações" span><textarea className="input" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} style={{ resize: 'vertical' }} /></Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
          <button className="btn btn-secondary" onClick={onDone}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : <><Save size={14} /> Salvar Alterações</>}
          </button>
        </div>
      </div>
    </div>
  );
}
