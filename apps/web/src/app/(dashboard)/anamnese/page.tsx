'use client';

import { useState } from 'react';
import { PatientSelector } from '@/components/shared/PatientSelector';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Shield,
  Pill,
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { useAnamneses, useCreateAnamnesis } from '@/hooks/useApi';

const STEPS = [
  { key: 'saude', title: 'Saúde Geral', icon: Heart },
  { key: 'alergias', title: 'Alergias e Medicações', icon: Pill },
  { key: 'historico', title: 'Histórico Médico', icon: ClipboardList },
  { key: 'habitos', title: 'Hábitos e Observações', icon: Shield },
];

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

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className="input-group" style={span ? { gridColumn: 'span 2' } : undefined}>
      <label className="input-label">{label}</label>
      {children}
    </div>
  );
}

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

export default function AnamnesePage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [noPatientWarn, setNoPatientWarn] = useState(false);

  const { data: anamnesesData } = useAnamneses(selectedPatientId || '');
  const createAnamnese = useCreateAnamnesis();
  
  const anamneses = (anamnesesData as any)?.data ?? anamnesesData ?? [];

  const updateField = (key: string, value: string | boolean) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const requirePatient = (): boolean => {
    if (!selectedPatientId) {
      setNoPatientWarn(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!requirePatient()) return;
    setSaving(true);
    try {
      await createAnamnese.mutateAsync({
        patientId: selectedPatientId,
        data: data,
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar anamnese');
    } finally {
      setSaving(false);
    }
  };

  const goToStep = (i: number) => {
    if (i > step && !requirePatient()) return;
    setStep(i);
  };

  const canGoNext = step < STEPS.length - 1;
  const canGoPrev = step > 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Anamnese</h1>
          <p className="page-subtitle">Questionário de saúde do paciente</p>
        </div>
      </div>

      {/* Patient Selector */}
      <PatientSelector
        label="Anamnese de"
        selectedPatientId={selectedPatientId ?? undefined}
        onSelect={(p) => { setSelectedPatientId(p.id || null); setNoPatientWarn(false); }}
      />

      {/* Warning: patient required */}
      {noPatientWarn && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          background: 'var(--warning-50)', border: '1px solid var(--warning-200)',
          borderRadius: 'var(--radius-lg)', color: 'var(--warning-700)',
          fontSize: 'var(--text-sm)', animation: 'fadeInUp 0.2s ease',
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <strong>Selecione um paciente</strong> antes de preencher ou salvar a anamnese.
        </div>
      )}

      {/* Existing Anamneses */}
      {selectedPatientId && anamneses.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-4)', animation: 'fadeIn 0.2s ease' }}>
          <div className="card-body">
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>
              Anamneses Anteriores ({anamneses.length})
            </h3>
            <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
              {anamneses.map((anamnese: any) => (
                <div key={anamnese.id} style={{
                  minWidth: 200, padding: 'var(--space-3)', background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <CheckCircle size={14} style={{ color: 'var(--success-500)' }} />
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>
                      {new Date(anamnese.filledAt || anamnese.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--gray-500)' }}>
                    Respondido por: {anamnese.patient?.name || 'O Próprio Paciente'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-body" style={{ padding: 'var(--space-4) var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
                  <button
                    onClick={() => goToStep(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)',
                      transition: 'all 0.2s ease',
                      backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      background: isDone ? 'var(--success-500)' : isActive ? 'var(--primary-500)' : 'var(--gray-100)',
                      color: isDone || isActive ? 'white' : 'var(--gray-400)',
                      transition: 'all 0.2s ease', flexShrink: 0,
                    }}>
                      {isDone ? <CheckCircle size={18} /> : <Icon size={18} />}
                    </div>
                    <span style={{
                      fontSize: 'var(--text-sm)', fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-normal)',
                      color: isActive ? 'var(--primary-700)' : isDone ? 'var(--success-700)' : 'var(--gray-400)',
                      whiteSpace: 'nowrap',
                    }}>
                      {s.title}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      flex: 1, height: 2, margin: '0 var(--space-2)',
                      background: isDone ? 'var(--success-300)' : 'var(--gray-100)',
                      borderRadius: 1, transition: 'background 0.3s ease',
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', animation: 'fadeInUp 0.3s ease' }}>
        <div className="card-header">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
            {STEPS[step].title}
          </h3>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-400)' }}>
            Etapa {step + 1} de {STEPS.length}
          </span>
        </div>
        <div className="card-body">
          {/* Step 1: Saúde Geral */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {HEALTH_QUESTIONS.map((q) => (
                <YesNoToggle key={q.id} label={q.label} value={data[q.id] as boolean | undefined} onChange={(v) => updateField(q.id, v)} />
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                <Field label="Pressão arterial habitual">
                  <input className="input" placeholder="Ex: 120/80 mmHg" value={String(data.pressao || '')} onChange={(e) => updateField('pressao', e.target.value)} />
                </Field>
                <Field label="Tipo sanguíneo">
                  <select className="input" value={String(data.tipo_sanguineo || '')} onChange={(e) => updateField('tipo_sanguineo', e.target.value)}>
                    <option value="">Selecione...</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* Step 2: Alergias */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Field label="Alergias conhecidas">
                <textarea className="input" rows={3} placeholder="Liste alergias a medicamentos, alimentos, materiais..." value={String(data.alergias || '')} onChange={(e) => updateField('alergias', e.target.value)} style={{ resize: 'vertical' }} />
              </Field>
              <Field label="Medicamentos em uso">
                <textarea className="input" rows={3} placeholder="Liste medicamentos que o paciente toma regularmente com dosagem" value={String(data.medicamentos || '')} onChange={(e) => updateField('medicamentos', e.target.value)} style={{ resize: 'vertical' }} />
              </Field>
              <Field label="Usa anticoagulante?">
                <ChipSelect options={['Não', 'Sim - AAS', 'Sim - Varfarina', 'Sim - Outro']} value={String(data.anticoagulante || '')} onChange={(v) => updateField('anticoagulante', v)} />
              </Field>
              <Field label="Suplementos e vitaminas">
                <input className="input" placeholder="Ex: Vitamina D, Ômega 3..." value={String(data.suplementos || '')} onChange={(e) => updateField('suplementos', e.target.value)} />
              </Field>
            </div>
          )}

          {/* Step 3: Histórico */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {PROCEDURES_HISTORY.map((q) => (
                <div key={q.id}>
                  <YesNoToggle label={q.label} value={data[q.id] as boolean | undefined} onChange={(v) => updateField(q.id, v)} />
                  {data[q.id] && (
                    <div style={{ marginLeft: 'var(--space-4)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      <textarea className="input" rows={2} placeholder="Descreva detalhes, data, local..." value={String(data[`${q.id}_detail`] || '')} onChange={(e) => updateField(`${q.id}_detail`, e.target.value)} style={{ resize: 'vertical', fontSize: 'var(--text-sm)' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Hábitos */}
          {step === 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Field label="Tabagismo">
                <ChipSelect options={['Nunca fumou', 'Ex-fumante', 'Fumante eventual', 'Fumante diário']} value={String(data.tabagismo || '')} onChange={(v) => updateField('tabagismo', v)} />
              </Field>
              <Field label="Etilismo">
                <ChipSelect options={['Não bebe', 'Social', 'Regular', 'Diário']} value={String(data.etilismo || '')} onChange={(v) => updateField('etilismo', v)} />
              </Field>
              <Field label="Bruxismo / Apertamento">
                <ChipSelect options={['Não', 'Sim - Diurno', 'Sim - Noturno', 'Sim - Ambos']} value={String(data.bruxismo || '')} onChange={(v) => updateField('bruxismo', v)} />
              </Field>
              <Field label="Respiração">
                <ChipSelect options={['Nasal', 'Bucal', 'Mista']} value={String(data.respiracao || '')} onChange={(v) => updateField('respiracao', v)} />
              </Field>
              <Field label="Observações gerais" span>
                <textarea className="input" rows={4} placeholder="Informações adicionais relevantes para o tratamento..." value={String(data.observacoes || '')} onChange={(e) => updateField('observacoes', e.target.value)} style={{ resize: 'vertical' }} />
              </Field>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: 'var(--space-10)',
      }}>
        <button
          className="btn btn-secondary"
          onClick={() => setStep(step - 1)}
          disabled={!canGoPrev}
        >
          <ChevronLeft size={18} /> Anterior
        </button>

        {saved && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            color: 'var(--success-600)', fontSize: 'var(--text-sm)', animation: 'fadeInUp 0.3s ease',
          }}>
            <CheckCircle size={18} /> Anamnese salva com sucesso!
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {step === STEPS.length - 1 ? (
            <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving || saved}>
              {saving ? (
                <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Salvando...</>
              ) : (
                <><Save size={18} /> Salvar Anamnese</>
              )}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => { if (requirePatient()) setStep(step + 1); }} disabled={!canGoNext}>
              Próximo <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
