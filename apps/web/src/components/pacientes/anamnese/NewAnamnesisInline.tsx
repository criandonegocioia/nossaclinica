'use client';

import { useState } from 'react';
import {
  ChevronLeft, Save, Heart, Pill, ClipboardList, Eye,
} from 'lucide-react';
import { useCreateAnamnesis, useUpdateAnamnesis } from '@/hooks/useApi';
import { Field, InlineFormHeader } from '@/components/pacientes/shared/ui';

// ── Constants ──────────────────────────────────────────────────────────────────
const HEALTH_QUESTIONS = [
  { id: 'cardiopatia', label: 'Possui alguma cardiopatia?' },
  { id: 'hipertensao', label: 'É hipertenso(a)?' },
  { id: 'diabetes', label: 'É diabético(a)?' },
  { id: 'hepatite', label: 'Já teve hepatite?' },
  { id: 'hiv', label: 'Portador(a) de HIV?' },
  { id: 'gravidez', label: 'Está grávida ou suspeita?' },
  { id: 'anemia', label: 'Possui anemia?' },
  { id: 'hemorragia', label: 'Tem tendência a hemorragias?' },
  { id: 'convulsao', label: 'Já teve convulsões ou epilepsia?' },
  { id: 'rinite', label: 'Tem rinite ou sinusite crônica?' },
  { id: 'asma', label: 'Possui asma?' },
  { id: 'febre_reumatica', label: 'Já teve febre reumática?' },
];

const PROCEDURES_HISTORY = [
  { id: 'cirurgia', label: 'Já realizou alguma cirurgia?' },
  { id: 'anestesia_reacao', label: 'Já teve reação a anestesia?' },
  { id: 'internacao', label: 'Já ficou internado(a)?' },
  { id: 'radioterapia', label: 'Já fez radioterapia ou quimioterapia?' },
  { id: 'transfusao', label: 'Já recebeu transfusão sanguínea?' },
  { id: 'tratamento_dental', label: 'Já fez tratamento ortodôntico?' },
];

const ANAMNESE_STEPS = [
  { key: 'saude', title: 'Saúde Geral', icon: Heart },
  { key: 'alergias', title: 'Alergias e Medicações', icon: Pill },
  { key: 'historico', title: 'Histórico Médico', icon: ClipboardList },
  { key: 'habitos', title: 'Hábitos e Observações', icon: Eye },
];

// ── Sub-components ─────────────────────────────────────────────────────────────
function YesNoToggle({ label, value, onChange }: { label: string; value: boolean | undefined; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--gray-50)' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
        <button type="button" className={`btn btn-sm ${value === true ? 'btn-primary' : 'btn-ghost'}`} onClick={() => onChange(true)} style={{ minWidth: 50 }}>Sim</button>
        <button type="button" className={`btn btn-sm ${value === false ? 'btn-primary' : 'btn-ghost'}`} onClick={() => onChange(false)} style={{ minWidth: 50 }}>Não</button>
      </div>
    </div>
  );
}

function ChipSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
      {options.map((o) => (
        <button key={o} type="button"
          className={`btn btn-sm ${value === o ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => onChange(o)} style={{ fontSize: '12px' }}>{o}</button>
      ))}
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────
export interface NewAnamnesisInlineProps {
  patientId: string;
  onDone: () => void;
  anamnesisId?: string;
  initialData?: Record<string, string | boolean>;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function NewAnamnesisInline({ patientId, onDone, anamnesisId, initialData }: NewAnamnesisInlineProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string | boolean>>(initialData || {});
  const create = useCreateAnamnesis();
  const update = useUpdateAnamnesis();

  const isPending = create.isPending || update.isPending;
  const set = (key: string, val: string | boolean) => setData((prev) => ({ ...prev, [key]: val }));

  const handleSave = async (finalStatus: 'PREENCHIDA' | 'RASCUNHO' = 'PREENCHIDA') => {
    if (anamnesisId) {
      await update.mutateAsync({ id: anamnesisId, patientId, status: finalStatus, data });
    } else {
      await create.mutateAsync({ patientId, filledAt: new Date().toISOString(), status: finalStatus, data });
    }
    onDone();
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {HEALTH_QUESTIONS.map((q) => (
            <YesNoToggle key={q.id} label={q.label} value={data[q.id] as boolean | undefined} onChange={(v) => set(q.id, v)} />
          ))}
          <div className="grid grid-2" style={{ marginTop: 'var(--space-4)' }}>
            <Field label="Idade"><input className="input" type="number" min="0" max="120" placeholder="Ex: 35" value={(data.idade as string) || ''} onChange={(e) => set('idade', e.target.value)} /></Field>
            <Field label="Pressão arterial habitual"><input className="input" placeholder="Ex: 120/80 mmHg" value={(data.pressao as string) || ''} onChange={(e) => set('pressao', e.target.value)} /></Field>
            <Field label="Tipo sanguíneo">
              <select className="input" value={(data.tipo_sanguineo as string) || ''} onChange={(e) => set('tipo_sanguineo', e.target.value)}>
                <option value="">Selecione...</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </Field>
          </div>
        </div>
      );
      case 1: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Field label="Alergias conhecidas"><textarea className="input" rows={3} placeholder="Liste alergias a medicamentos, alimentos, materiais..." value={(data.alergias as string) || ''} onChange={(e) => set('alergias', e.target.value)} style={{ resize: 'vertical' }} /></Field>
          <Field label="Medicamentos em uso"><textarea className="input" rows={3} placeholder="Liste medicamentos que o paciente toma regularmente com dosagem" value={(data.medicamentos as string) || ''} onChange={(e) => set('medicamentos', e.target.value)} style={{ resize: 'vertical' }} /></Field>
          <Field label="Usa anticoagulante?"><ChipSelect options={['Não', 'Sim - AAS', 'Sim - Varfarina', 'Sim - Outro']} value={(data.anticoagulante as string) || ''} onChange={(v) => set('anticoagulante', v)} /></Field>
          <Field label="Suplementos e vitaminas"><input className="input" placeholder="Ex: Vitamina D, Ômega 3..." value={(data.suplementos as string) || ''} onChange={(e) => set('suplementos', e.target.value)} /></Field>
        </div>
      );
      case 2: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {PROCEDURES_HISTORY.map((q) => (
            <div key={q.id}>
              <YesNoToggle label={q.label} value={data[q.id] as boolean | undefined} onChange={(v) => set(q.id, v)} />
              {data[q.id] && (
                <div style={{ marginLeft: 'var(--space-4)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <textarea className="input" rows={2} placeholder="Descreva detalhes, data, local..." value={(data[`${q.id}_detail`] as string) || ''} onChange={(e) => set(`${q.id}_detail`, e.target.value)} style={{ resize: 'vertical', fontSize: 'var(--text-sm)' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      );
      case 3: return (
        <div className="grid grid-2">
          <Field label="Tabagismo"><ChipSelect options={['Nunca fumou', 'Ex-fumante', 'Fumante eventual', 'Fumante diário']} value={(data.tabagismo as string) || ''} onChange={(v) => set('tabagismo', v)} /></Field>
          <Field label="Etilismo"><ChipSelect options={['Não bebe', 'Social', 'Regular', 'Diário']} value={(data.etilismo as string) || ''} onChange={(v) => set('etilismo', v)} /></Field>
          <Field label="Bruxismo / Apertamento"><ChipSelect options={['Não', 'Sim - Diurno', 'Sim - Noturno', 'Sim - Ambos']} value={(data.bruxismo as string) || ''} onChange={(v) => set('bruxismo', v)} /></Field>
          <Field label="Respiração"><ChipSelect options={['Nasal', 'Bucal', 'Mista']} value={(data.respiracao as string) || ''} onChange={(v) => set('respiracao', v)} /></Field>
          <Field label="Observações gerais" span><textarea className="input" rows={4} placeholder="Informações adicionais relevantes para o tratamento..." value={(data.observacoes as string) || ''} onChange={(e) => set('observacoes', e.target.value)} style={{ resize: 'vertical' }} /></Field>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <InlineFormHeader title={anamnesisId ? "Editar Ficha de Anamnese" : "Nova Ficha de Anamnese"} onBack={onDone} />
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 'var(--space-5)' }}>
          {ANAMNESE_STEPS.map((s, i) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < ANAMNESE_STEPS.length - 1 ? 1 : undefined }}>
              <button onClick={() => setStep(i)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: i === step ? 'var(--primary-50)' : 'transparent' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, background: i < step ? 'var(--success-500)' : i === step ? 'var(--primary-500)' : 'var(--gray-100)', color: i <= step ? 'white' : 'var(--gray-400)' }}>{i < step ? '✓' : <s.icon size={14} />}</div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: i === step ? 600 : 400, color: i === step ? 'var(--primary-700)' : i < step ? 'var(--success-700)' : 'var(--gray-400)', whiteSpace: 'nowrap' }}>{s.title}</span>
              </button>
              {i < ANAMNESE_STEPS.length - 1 && <div style={{ flex: 1, height: 2, margin: '0 var(--space-1)', background: i < step ? 'var(--success-300)' : 'var(--gray-100)', borderRadius: 1 }} />}
            </div>
          ))}
        </div>
        {/* Step content */}
        <div style={{ minHeight: 200 }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 'var(--space-3)', textAlign: 'right' }}>Etapa {step + 1} de {ANAMNESE_STEPS.length}</div>
          {renderStep()}
        </div>
        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
          <button className="btn btn-secondary" onClick={() => step > 0 ? setStep(step - 1) : onDone()} >
            <ChevronLeft size={16} /> {step > 0 ? 'Anterior' : 'Cancelar'}
          </button>
          {step < ANAMNESE_STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Próximo →</button>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn btn-ghost" onClick={() => handleSave('RASCUNHO')} disabled={isPending}>Salvar Rascunho</button>
              <button className="btn btn-primary" onClick={() => handleSave('PREENCHIDA')} disabled={isPending}>
                {isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : <><Save size={14} /> Finalizar</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
