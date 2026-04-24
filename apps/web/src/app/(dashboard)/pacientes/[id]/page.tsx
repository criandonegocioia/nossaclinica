'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Edit, FileText, Camera, FolderOpen, DollarSign,
  Stethoscope, Calendar, Phone, Mail, MapPin, Clock, Plus,
  ExternalLink, CheckCircle, Loader2, X, Save, Upload,
  ChevronLeft, Banknote, Smartphone, CreditCard, Building2, Printer,
} from 'lucide-react';
import {
  usePatient, useUpdatePatient, useCreateMedicalRecord,
  useUploadPhoto, useCreateFinance, useCreateSchedule, useCreateAnamnesis,
  usePatientPhotos, useFinances, useMedicalRecords, useCreateDocument,
  useSchedules, useDocuments, useAnamneses, useMedications,
  useUsers, useRooms, useProcedures
} from '@/hooks/useApi';

// ── Constants ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'prontuario',   label: 'Prontuário',   icon: FileText },
  { id: 'fotos',        label: 'Fotos',         icon: Camera },
  { id: 'documentos',   label: 'Documentos',    icon: FolderOpen },
  { id: 'anamnese',     label: 'Anamnese',      icon: Stethoscope },
  { id: 'financeiro',   label: 'Financeiro',    icon: DollarSign },
  { id: 'agendamentos', label: 'Agendamentos',  icon: Calendar },
];

const GENDER_LABEL: Record<string, string> = {
  MASCULINO: 'Masculino', FEMININO: 'Feminino',
  OUTRO: 'Outro', NAO_INFORMADO: 'Não informado',
};

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'PIX', CARTAO_CREDITO: 'Cartão Crédito', CARTAO_DEBITO: 'Cartão Débito',
  DINHEIRO: 'Dinheiro', BOLETO: 'Boleto', TRANSFERENCIA: 'Transferência',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function calcAge(birthDate: string | null) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

// ── Reusable inline form field ─────────────────────────────────────────────────
function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className="input-group" style={span ? { gridColumn: 'span 2' } : undefined}>
      <label className="input-label">{label}</label>
      {children}
    </div>
  );
}

// ── Section header with back button ────────────────────────────────────────────
function InlineFormHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
      <button className="btn btn-ghost btn-sm btn-icon" onClick={onBack} title="Voltar para a lista">
        <ChevronLeft size={18} />
      </button>
      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--gray-900)' }}>{title}</h3>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE FORMS — each renders INSIDE the tab area
// ═══════════════════════════════════════════════════════════════════════════════

// ── Edit Patient (inline) ──────────────────────────────────────────────────────
function EditPatientInline({ patient, onDone }: { patient: Record<string, unknown>; onDone: () => void }) {
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
          <Field label="Nome completo" span>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="CPF">
            <input className="input" value={form.cpf} onChange={(e) => set('cpf', e.target.value)} />
          </Field>
          <Field label="Data de nascimento">
            <input className="input" type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
          </Field>
          <Field label="Gênero">
            <select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              {Object.entries(GENDER_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Profissão">
            <input className="input" value={form.profession} onChange={(e) => set('profession', e.target.value)} />
          </Field>
          <Field label="Telefone principal">
            <input className="input" type="tel" value={form.phoneMain} onChange={(e) => set('phoneMain', e.target.value)} />
          </Field>
          <Field label="WhatsApp">
            <input className="input" type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
          </Field>
          <Field label="E-mail" span>
            <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Endereço" span>
            <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <Field label="Cidade">
            <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="Estado (UF)">
            <input className="input" value={form.state} onChange={(e) => set('state', e.target.value)} />
          </Field>
          <Field label="Convênio">
            <input className="input" value={form.healthInsurance} onChange={(e) => set('healthInsurance', e.target.value)} />
          </Field>
          <Field label="Origem / Canal">
            <input className="input" value={form.origin} onChange={(e) => set('origin', e.target.value)} />
          </Field>
          <Field label="Observações" span>
            <textarea className="input" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
          </Field>
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

// ── New Medical Record (inline) ────────────────────────────────────────────────
function NewRecordInline({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [form, setForm] = useState({
    dateTime: new Date().toISOString().slice(0, 16),
    procedures: '', complaint: '', diagnosis: '', treatment: '', prescription: '', notes: '', nextReturn: '',
  });
  const create = useCreateMedicalRecord();
  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async (asDraft: boolean) => {
    await create.mutateAsync({ patientId, ...form, dateTime: new Date(form.dateTime).toISOString(), isDraft: asDraft });
    onDone();
  };

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <InlineFormHeader title="Novo Atendimento" onBack={onDone} />
        <div className="grid grid-2">
          <Field label="Data e hora">
            <input className="input" type="datetime-local" value={form.dateTime} onChange={(e) => set('dateTime', e.target.value)} />
          </Field>
          <Field label="Procedimento(s)">
            <input className="input" value={form.procedures} onChange={(e) => set('procedures', e.target.value)} placeholder="Ex: Toxina Botulínica - Frontal" />
          </Field>
          <Field label="Queixa principal" span>
            <textarea className="input" rows={2} value={form.complaint} onChange={(e) => set('complaint', e.target.value)} placeholder="Descreva a queixa do paciente..." style={{ resize: 'vertical' }} />
          </Field>
          <Field label="Diagnóstico" span>
            <textarea className="input" rows={2} value={form.diagnosis} onChange={(e) => set('diagnosis', e.target.value)} style={{ resize: 'vertical' }} />
          </Field>
          <Field label="Tratamento / Evolução" span>
            <textarea className="input" rows={3} value={form.treatment} onChange={(e) => set('treatment', e.target.value)} placeholder="Descreva o tratamento realizado..." style={{ resize: 'vertical' }} />
          </Field>
          <Field label="Prescrição / Receita" span>
            <textarea className="input" rows={2} value={form.prescription} onChange={(e) => set('prescription', e.target.value)} style={{ resize: 'vertical' }} />
          </Field>
          <Field label="Observações internas" span>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
          </Field>
          <Field label="Data de retorno">
            <input className="input" type="date" value={form.nextReturn} onChange={(e) => set('nextReturn', e.target.value)} />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
          <button className="btn btn-secondary" onClick={onDone}>Cancelar</button>
          <button className="btn btn-ghost" onClick={() => handleSave(true)} disabled={create.isPending}>Salvar Rascunho</button>
          <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={create.isPending}>
            {create.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : <><CheckCircle size={14} /> Finalizar Atendimento</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Upload Photo (inline) ──────────────────────────────────────────────────────
function UploadPhotoInline({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('ANTES');
  const [desc, setDesc] = useState('');
  const [dragging, setDragging] = useState(false);
  const upload = useUploadPhoto();

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter((f) => f.type.startsWith('image/'));
    setFiles((prev) => [...prev, ...arr]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('patientId', patientId);
      fd.append('category', category);
      fd.append('description', desc);
      await upload.mutateAsync(fd);
    }
    onDone();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <InlineFormHeader title="Upload de Fotos" onBack={onDone} />

        {/* Categoria + Descrição primeiro */}
        <div className="grid grid-2" style={{ marginBottom: 'var(--space-5)' }}>
          <Field label="Categoria">
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="ANTES">Antes</option>
              <option value="DURANTE">Durante</option>
              <option value="DEPOIS">Depois</option>
              <option value="RAIO_X">Raio-X</option>
              <option value="TOMOGRAFIA">Tomografia</option>
              <option value="OUTRO">Outro</option>
            </select>
          </Field>
          <Field label="Descrição">
            <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex: Foto frontal antes do tratamento" />
          </Field>
        </div>

        {/* Drag & Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true; inp.onchange = (ev) => { const t = ev.target as HTMLInputElement; if (t.files) addFiles(t.files); }; inp.click(); }}
          style={{
            border: `2px dashed ${dragging ? 'var(--primary-400)' : 'var(--gray-200)'}`,
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-10)',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'var(--primary-25, #f0fdfa)' : 'var(--gray-25)',
            transition: 'all 0.2s ease',
          }}
        >
          <Upload size={36} style={{ margin: '0 auto var(--space-3)', color: dragging ? 'var(--primary-500)' : 'var(--gray-300)' }} />
          <p style={{ fontWeight: 'var(--font-medium)', color: dragging ? 'var(--primary-600)' : 'var(--gray-600)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
            {dragging ? 'Solte as imagens aqui' : 'Arraste e solte imagens aqui'}
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
            ou <span style={{ color: 'var(--primary-500)', textDecoration: 'underline' }}>clique para selecionar</span> · JPG, PNG, WEBP
          </p>
        </div>

        {/* Thumbnails preview */}
        {files.length > 0 && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              {files.length} arquivo(s) selecionado(s)
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              {files.map((file, i) => (
                <div key={`${file.name}-${i}`} style={{ position: 'relative', width: 80, height: 80, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--gray-100)' }}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    style={{
                      position: 'absolute', top: 2, right: 2,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)', border: 'none',
                      color: 'white', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', lineHeight: 1,
                    }}
                  >✕</button>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0,0,0,0.5)', color: 'white',
                    fontSize: '8px', padding: '2px 4px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{file.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
          <button className="btn btn-secondary" onClick={onDone}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={upload.isPending || files.length === 0}>
            {upload.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Enviando...</> : <><Upload size={14} /> Enviar {files.length > 0 ? `${files.length} Foto(s)` : 'Fotos'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Anamnesis (inline – 4-step wizard matching /anamnese) ───────────────────
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
  { key: 'saude', title: 'Saúde Geral' },
  { key: 'alergias', title: 'Alergias e Medicações' },
  { key: 'historico', title: 'Histórico Médico' },
  { key: 'habitos', title: 'Hábitos e Observações' },
];

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

function NewAnamnesisInline({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string | boolean>>({});
  const create = useCreateAnamnesis();

  const set = (key: string, val: string | boolean) => setData((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    await create.mutateAsync({
      patientId,
      filledAt: new Date().toISOString(),
      status: 'PREENCHIDA',
      data,
    });
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
            <Field label="Pressão arterial habitual">
              <input className="input" placeholder="Ex: 120/80 mmHg" value={(data.pressao as string) || ''} onChange={(e) => set('pressao', e.target.value)} />
            </Field>
            <Field label="Tipo sanguíneo">
              <select className="input" value={(data.tipo_sanguineo as string) || ''} onChange={(e) => set('tipo_sanguineo', e.target.value)}>
                <option value="">Selecione...</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      );
      case 1: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Field label="Alergias conhecidas">
            <textarea className="input" rows={3} placeholder="Liste alergias a medicamentos, alimentos, materiais..." value={(data.alergias as string) || ''} onChange={(e) => set('alergias', e.target.value)} style={{ resize: 'vertical' }} />
          </Field>
          <Field label="Medicamentos em uso">
            <textarea className="input" rows={3} placeholder="Liste medicamentos que o paciente toma regularmente com dosagem" value={(data.medicamentos as string) || ''} onChange={(e) => set('medicamentos', e.target.value)} style={{ resize: 'vertical' }} />
          </Field>
          <Field label="Usa anticoagulante?">
            <ChipSelect options={['Não', 'Sim - AAS', 'Sim - Varfarina', 'Sim - Outro']} value={(data.anticoagulante as string) || ''} onChange={(v) => set('anticoagulante', v)} />
          </Field>
          <Field label="Suplementos e vitaminas">
            <input className="input" placeholder="Ex: Vitamina D, Ômega 3..." value={(data.suplementos as string) || ''} onChange={(e) => set('suplementos', e.target.value)} />
          </Field>
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
          <Field label="Tabagismo">
            <ChipSelect options={['Nunca fumou', 'Ex-fumante', 'Fumante eventual', 'Fumante diário']} value={(data.tabagismo as string) || ''} onChange={(v) => set('tabagismo', v)} />
          </Field>
          <Field label="Etilismo">
            <ChipSelect options={['Não bebe', 'Social', 'Regular', 'Diário']} value={(data.etilismo as string) || ''} onChange={(v) => set('etilismo', v)} />
          </Field>
          <Field label="Bruxismo / Apertamento">
            <ChipSelect options={['Não', 'Sim - Diurno', 'Sim - Noturno', 'Sim - Ambos']} value={(data.bruxismo as string) || ''} onChange={(v) => set('bruxismo', v)} />
          </Field>
          <Field label="Respiração">
            <ChipSelect options={['Nasal', 'Bucal', 'Mista']} value={(data.respiracao as string) || ''} onChange={(v) => set('respiracao', v)} />
          </Field>
          <Field label="Observações gerais" span>
            <textarea className="input" rows={4} placeholder="Informações adicionais relevantes para o tratamento..." value={(data.observacoes as string) || ''} onChange={(e) => set('observacoes', e.target.value)} style={{ resize: 'vertical' }} />
          </Field>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <InlineFormHeader title="Nova Ficha de Anamnese" onBack={onDone} />

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 'var(--space-5)' }}>
          {ANAMNESE_STEPS.map((s, i) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < ANAMNESE_STEPS.length - 1 ? 1 : undefined }}>
              <button onClick={() => setStep(i)} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)',
                backgroundColor: i === step ? 'var(--primary-50)' : 'transparent',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600,
                  background: i < step ? 'var(--success-500)' : i === step ? 'var(--primary-500)' : 'var(--gray-100)',
                  color: i <= step ? 'white' : 'var(--gray-400)',
                }}>{i < step ? '✓' : i + 1}</div>
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
            <button className="btn btn-primary" onClick={handleSave} disabled={create.isPending}>
              {create.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : <><Save size={14} /> Salvar Anamnese</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Procedure Price Registry (insert-only, latest = active) ──────────────────
interface ProcedurePrice {
  id: string;
  code: string;
  name: string;
  price: number;
  createdAt: string;
  createdBy: string;
  status: 'ATIVO' | 'INATIVO';
}

const INITIAL_PROCEDURE_PRICES: ProcedurePrice[] = [
  { id: 'pp1', code: 'TOX-001', name: 'Toxina Botulínica - Frontal', price: 500, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp2', code: 'TOX-002', name: 'Toxina Botulínica - Glabela', price: 500, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp3', code: 'TOX-003', name: 'Toxina Botulínica - Periorbicular', price: 450, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp4', code: 'TOX-004', name: 'Toxina Botulínica - Masseter', price: 600, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp5', code: 'PRE-001', name: 'Preenchimento - Lábios', price: 1200, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp6', code: 'PRE-002', name: 'Preenchimento - Sulco Nasogeniano', price: 1400, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp7', code: 'PRE-003', name: 'Preenchimento - Malar', price: 1500, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp8', code: 'PRE-004', name: 'Preenchimento - Mandíbula', price: 1800, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp9', code: 'PRE-005', name: 'Preenchimento - Mento (queixo)', price: 1300, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp10', code: 'BIO-001', name: 'Bioestimulador de Colágeno', price: 2500, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp11', code: 'FIO-001', name: 'Fios de PDO', price: 3000, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp12', code: 'EST-001', name: 'Limpeza de Pele', price: 250, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp13', code: 'EST-002', name: 'Peeling Químico', price: 500, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp14', code: 'EST-003', name: 'Microagulhamento', price: 400, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp15', code: 'ODO-001', name: 'Clareamento Dental', price: 800, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp16', code: 'ODO-002', name: 'Restauração Dentária', price: 350, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp17', code: 'ODO-003', name: 'Exodontia (extração)', price: 300, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp18', code: 'ODO-004', name: 'Profilaxia (limpeza)', price: 200, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
];

// ── Campaigns ────────────────────────────────────────────────────────────────
interface Campaign {
  id: string;
  name: string;
  discountType: 'PERCENTUAL' | 'FIXO';
  discountValue: number;
  startDate: string;
  endDate: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'AMBOS';
  active: boolean;
}

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Semana da Beleza', discountType: 'PERCENTUAL', discountValue: 15, startDate: '2026-04-15', endDate: '2026-04-30', channel: 'WHATSAPP', active: true },
  { id: 'c2', name: 'Mês do Sorriso', discountType: 'FIXO', discountValue: 100, startDate: '2026-05-01', endDate: '2026-05-31', channel: 'AMBOS', active: false },
];

// ── New Finance Entry (inline) ─────────────────────────────────────────────────
function NewFinanceInline({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [form, setForm] = useState({
    paymentMethod: 'PIX', status: 'PENDENTE',
    dueDate: '', installments: '1', notes: '',
  });

  const [selectedProcs, setSelectedProcs] = useState<ProcedurePrice[]>([]);
  const [discountType, setDiscountType] = useState<'NENHUM' | 'PERCENTUAL' | 'FIXO'>('NENHUM');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [customDescription, setCustomDescription] = useState('');

  const create = useCreateFinance();
  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const activePrices = INITIAL_PROCEDURE_PRICES.filter(p => p.status === 'ATIVO');

  const handleToggleProc = (proc: ProcedurePrice) => {
    setSelectedProcs(prev => 
      prev.some(p => p.id === proc.id) ? prev.filter(p => p.id !== proc.id) : [...prev, proc]
    );
  };

  const getSubtotal = () => selectedProcs.reduce((acc, p) => acc + p.price, 0);
  const getDiscountAmount = () => {
    const sub = getSubtotal();
    if (discountType === 'PERCENTUAL') return sub * (discountValue / 100);
    if (discountType === 'FIXO') return discountValue;
    return 0;
  };
  const getTotal = () => Math.max(0, getSubtotal() - getDiscountAmount());

  const handleSave = async () => {
    const total = getTotal();
    const procNames = selectedProcs.map(p => p.name).join(' + ');
    const desc = customDescription 
      ? (procNames ? `${procNames} - ${customDescription}` : customDescription)
      : procNames;
      
    if (!desc || total <= 0) return;

    await create.mutateAsync({
      patientId,
      description: desc,
      amount: total,
      paymentMethod: form.paymentMethod,
      status: form.status,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      installments: parseInt(form.installments, 10),
      notes: form.notes || undefined,
      paidAt: form.status === 'PAGO' ? new Date().toISOString() : undefined,
    });
    onDone();
  };

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <InlineFormHeader title="Novo Lançamento Financeiro" onBack={onDone} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Procedures Selection */}
          <Field label="Selecione os procedimentos para cobrança" span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-1)', maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--gray-200)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
              {activePrices.map((proc) => {
                const selected = selectedProcs.some((p) => p.id === proc.id);
                return (
                  <label key={proc.id} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', fontSize: 'var(--text-xs)',
                    background: selected ? 'var(--primary-50)' : 'transparent',
                    color: selected ? 'var(--primary-700)' : 'var(--gray-600)',
                    transition: 'all 0.1s ease',
                  }}>
                    <input type="checkbox" checked={selected} onChange={() => handleToggleProc(proc)}
                      style={{ width: 14, height: 14, accentColor: 'var(--primary-500)' }} />
                    <span style={{ flex: 1 }}>{proc.name}</span>
                    <span style={{ fontWeight: 600, color: 'var(--success-700)', fontSize: '11px' }}>
                      R$ {proc.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </label>
                );
              })}
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <input className="input" style={{ fontSize: 'var(--text-xs)' }} value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} placeholder="Descrição adicional ou procedimentos customizados... (opcional)" />
            </div>
          </Field>

          {/* Value Summary Component */}
          <div style={{ display: 'flex', background: 'var(--gray-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', gap: 'var(--space-4)', alignItems: 'center' }}>
             <div style={{ flex: 1 }}>
               <div style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Subtotal</div>
               <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--gray-700)' }}>R$ {getSubtotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
             </div>
             
             <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', borderLeft: '1px solid var(--gray-200)', paddingLeft: 'var(--space-4)' }}>
               <Field label="Desconto">
                 <div style={{ display: 'flex', gap: '1px', background: 'var(--gray-200)', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <select className="input" style={{ width: 90, border: 'none', borderRadius: 0, height: 32, fontSize: '12px' }} value={discountType} onChange={(e) => { setDiscountType(e.target.value as any); if (e.target.value === 'NENHUM') setDiscountValue(0); }}>
                      <option value="NENHUM">Nenhum</option>
                      <option value="PERCENTUAL">% Perc.</option>
                      <option value="FIXO">R$ Fixo</option>
                    </select>
                    <input className="input" type="number" min="0" step="0.01" style={{ width: 80, border: 'none', borderRadius: 0, height: 32, fontSize: '12px' }} disabled={discountType === 'NENHUM'} value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} />
                 </div>
               </Field>
             </div>

             <div style={{ paddingLeft: 'var(--space-4)', borderLeft: '1px solid var(--gray-200)', minWidth: 120 }}>
               <div style={{ fontSize: '11px', color: 'var(--primary-600)', fontWeight: 600, textTransform: 'uppercase' }}>Total a Pagar</div>
               <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--primary-700)' }}>R$ {getTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
             </div>
          </div>

          <div className="grid grid-2">
            <Field label="Método de pagamento">
              <select className="input" value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>
                {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="PENDENTE">Pendente</option>
                <option value="PAGO">Pago</option>
              </select>
            </Field>
            <Field label="Parcelas">
              <input className="input" type="number" min="1" max="24" value={form.installments} onChange={(e) => set('installments', e.target.value)} />
            </Field>
            <Field label="Data de vencimento">
              <input className="input" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </Field>
            <Field label="Observações" span>
              <input className="input" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Observações opcionais" />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
          <button className="btn btn-secondary" onClick={onDone}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={create.isPending || (!selectedProcs.length && !customDescription) || getTotal() <= 0}>
            {create.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : <><Save size={14} /> Salvar Lançamento</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Schedule (inline) ──────────────────────────────────────────────────────
function NewScheduleInline({ patientId, patientName, onDone }: { patientId: string; patientName: string; onDone: () => void }) {
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

// ── Generate Document (inline) ─────────────────────────────────────────────────
const DOC_TYPES = [
  { value: 'TERMO_CONSENTIMENTO', label: 'Termo de Consentimento' },
  { value: 'RECEITA', label: 'Receita / Prescrição' },
  { value: 'ATESTADO', label: 'Atestado' },
  { value: 'DECLARACAO', label: 'Declaração de Comparecimento' },
  { value: 'ENCAMINHAMENTO', label: 'Encaminhamento' },
  { value: 'LAUDO', label: 'Laudo Técnico' },
  { value: 'ORCAMENTO', label: 'Orçamento' },
  { value: 'OUTRO', label: 'Outro' },
];

const DOC_TEMPLATES: Record<string, (name: string) => string> = {
  TERMO_CONSENTIMENTO: (name) =>
    `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO\n\nEu, ${name}, declaro que fui devidamente informado(a) sobre o procedimento a ser realizado, seus riscos, benefícios e alternativas.\n\nAutorizo a realização do(s) procedimento(s) abaixo descrito(s):\n\nProcedimento: _________________________________\n\nFui orientado(a) sobre os cuidados pós-operatórios e estou ciente de que os resultados podem variar.\n\nData: ${new Date().toLocaleDateString('pt-BR')}\n\nAssinatura do paciente: _________________________\nAssinatura do profissional: _____________________`,
  RECEITA: (name) =>
    `RECEITA\n\nPaciente: ${name}\nData: ${new Date().toLocaleDateString('pt-BR')}\n\n1. ____________________________________________\n   Posologia: __________________________________\n\n2. ____________________________________________\n   Posologia: __________________________________\n\n3. ____________________________________________\n   Posologia: __________________________________\n\n\n_____________________________\nDr(a). ______________________\nCRO: _______________________`,
  ATESTADO: (name) =>
    `ATESTADO ODONTOLÓGICO\n\nAtesto para os devidos fins que o(a) paciente ${name} esteve sob meus cuidados profissionais na data de ${new Date().toLocaleDateString('pt-BR')}, necessitando de afastamento de suas atividades por _____ dia(s).\n\nCID: __________\n\nData: ${new Date().toLocaleDateString('pt-BR')}\n\n_____________________________\nDr(a). ______________________\nCRO: _______________________`,
  DECLARACAO: (name) =>
    `DECLARAÇÃO DE COMPARECIMENTO\n\nDeclaro para os devidos fins que o(a) paciente ${name} compareceu a esta clínica na data de ${new Date().toLocaleDateString('pt-BR')}, no horário de ___:___ às ___:___, para atendimento odontológico.\n\nData: ${new Date().toLocaleDateString('pt-BR')}\n\n_____________________________\nOdontoFace Clínica`,
  ENCAMINHAMENTO: (name) =>
    `ENCAMINHAMENTO\n\nData: ${new Date().toLocaleDateString('pt-BR')}\n\nEncaminho o(a) paciente ${name} para avaliação e conduta em:\n\nEspecialidade: _________________________________\nMotivo: ________________________________________\nObservações: ___________________________________\n\n\n_____________________________\nDr(a). ______________________\nCRO: _______________________`,
  LAUDO: (name) =>
    `LAUDO TÉCNICO\n\nPaciente: ${name}\nData: ${new Date().toLocaleDateString('pt-BR')}\n\nAnálise: _______________________________________\n________________________________________________\n\nConclusão: _____________________________________\n________________________________________________\n\n_____________________________\nDr(a). ______________________\nCRO: _______________________`,
  ORCAMENTO: (name) =>
    `Orçamento\n\nPaciente: ${name}\nData: ${new Date().toLocaleDateString('pt-BR')}\n\nValidade: 30 dias.\n\n_____________________________\nOdontoFace Clínica`,
  OUTRO: () => '',
};



const ALL_PROCEDURES = [
  'Toxina Botulínica - Frontal',
  'Toxina Botulínica - Glabela',
  'Toxina Botulínica - Periorbicular',
  'Toxina Botulínica - Masseter',
  'Preenchimento - Lábios',
  'Preenchimento - Sulco Nasogeniano',
  'Preenchimento - Malar',
  'Preenchimento - Mandíbula',
  'Preenchimento - Mento (queixo)',
  'Bioestimulador de Colágeno',
  'Fios de PDO',
  'Limpeza de Pele',
  'Peeling Químico',
  'Microagulhamento',
  'Clareamento Dental',
  'Restauração Dentária',
  'Exodontia (extração)',
  'Profilaxia (limpeza)',
];

// Correlation: which procedures are relevant for each document type
const DOC_TYPE_PROCEDURES: Record<string, string[] | null> = {
  TERMO_CONSENTIMENTO: null,
  RECEITA: null,
  ATESTADO: null,
  DECLARACAO: null,
  ENCAMINHAMENTO: [
    'Clareamento Dental', 'Restauração Dentária', 'Exodontia (extração)', 'Profilaxia (limpeza)',
  ],
  LAUDO: null,
  ORCAMENTO: null,
  OUTRO: null,
};

function getFilteredProcedures(docType: string): string[] {
  const filter = DOC_TYPE_PROCEDURES[docType];
  return filter ?? ALL_PROCEDURES;
}

// ── Budget Builder (Orçamento) ──────────────────────────────────────────────
interface BudgetLine {
  procId: string;
  code: string;
  name: string;
  unitPrice: number;
  discountType: 'NENHUM' | 'PERCENTUAL' | 'FIXO' | 'CAMPANHA';
  discountValue: number;
  campaignId?: string;
}

function BudgetBuilder({ patientName, patientId, onDone }: { patientName: string; patientId: string; onDone: () => void }) {
  const [prices, setPrices] = useState(INITIAL_PROCEDURE_PRICES);
  const [campaigns] = useState(INITIAL_CAMPAIGNS);
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [paymentCondition, setPaymentCondition] = useState('PIX');
  const [view, setView] = useState<'budget' | 'prices' | 'campaigns'>('budget');
  const { mutate: createDocument } = useCreateDocument();

  // Price management form
  const [newPrice, setNewPrice] = useState({ code: '', name: '', price: '' });

  const activePrices = prices.reduce((map, p) => {
    if (p.status === 'ATIVO') map.set(p.name, p);
    return map;
  }, new Map<string, ProcedurePrice>());

  const activeCampaigns = campaigns.filter((c) => {
    const now = new Date();
    return c.active && new Date(c.startDate) <= now && new Date(c.endDate) >= now;
  });

  const addLine = (proc: ProcedurePrice) => {
    if (lines.some((l) => l.procId === proc.id)) return;
    setLines((prev) => [...prev, {
      procId: proc.id, code: proc.code, name: proc.name,
      unitPrice: proc.price, discountType: 'NENHUM', discountValue: 0,
    }]);
  };

  const removeLine = (procId: string) => setLines((prev) => prev.filter((l) => l.procId !== procId));

  const updateLine = (procId: string, field: string, value: string | number) => {
    setLines((prev) => prev.map((l) => l.procId === procId ? { ...l, [field]: value } : l));
  };

  const applyLineCampaign = (procId: string, campId: string) => {
    const camp = campaigns.find((c) => c.id === campId);
    if (!camp) return;
    setLines((prev) => prev.map((l) =>
      l.procId === procId ? { ...l, discountType: 'CAMPANHA', discountValue: camp.discountValue, campaignId: campId } : l
    ));
  };

  const calcLineDiscount = (line: BudgetLine): number => {
    if (line.discountType === 'PERCENTUAL' || (line.discountType === 'CAMPANHA' && campaigns.find((c) => c.id === line.campaignId)?.discountType === 'PERCENTUAL')) {
      return line.unitPrice * (line.discountValue / 100);
    }
    if (line.discountType === 'FIXO' || (line.discountType === 'CAMPANHA' && campaigns.find((c) => c.id === line.campaignId)?.discountType === 'FIXO')) {
      return line.discountValue;
    }
    return 0;
  };

  const calcLineTotal = (line: BudgetLine): number => Math.max(0, line.unitPrice - calcLineDiscount(line));
  const grandTotal = lines.reduce((sum, l) => sum + calcLineTotal(l), 0);
  const totalDiscount = lines.reduce((sum, l) => sum + calcLineDiscount(l), 0);

  const addNewPrice = () => {
    if (!newPrice.code || !newPrice.name || !newPrice.price) return;
    // Inactivate previous entries with same name
    const updated = prices.map((p) => p.name === newPrice.name && p.status === 'ATIVO' ? { ...p, status: 'INATIVO' as const } : p);
    const entry: ProcedurePrice = {
      id: `pp-${Date.now()}`, code: newPrice.code, name: newPrice.name,
      price: parseFloat(newPrice.price), createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'Administrador', status: 'ATIVO',
    };
    setPrices([...updated, entry]);
    setNewPrice({ code: '', name: '', price: '' });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Create a plain text version for backend generic parsing
    const textSummary = `Orçamento - OdontoFace Clínica
Paciente: ${patientName}
Data: ${new Date().toLocaleDateString('pt-BR')}

Itens:
${lines.map((l, i) => `${i + 1}. ${l.code} - ${l.name} - Unit: R$ ${l.unitPrice.toLocaleString('pt-BR')} - Total: R$ ${calcLineTotal(l).toLocaleString('pt-BR')}`).join('\n')}

Desconto Total: R$ ${totalDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Total Final: R$ ${grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

Condição de Pagamento: ${paymentCondition}`;

    createDocument({
      type: 'ORCAMENTO',
      patientId: patientId,
      title: 'Orçamento',
      content: { text: textSummary, items: lines, subtotal: grandTotal + totalDiscount, discount: totalDiscount, total: grandTotal, paymentCondition: paymentCondition }
    });

    const tableRows = lines.map((l, i) => {
      const disc = calcLineDiscount(l);
      const total = calcLineTotal(l);
      return `<tr><td>${i + 1}</td><td>${l.code}</td><td>${l.name}</td><td>R$ ${l.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td><td>${disc > 0 ? `- R$ ${disc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</td><td><strong>R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td></tr>`;
    }).join('');
    printWindow.document.write(`<html><head><title>Orçamento - ${patientName}</title>
      <style>body{font-family:'Segoe UI',sans-serif;padding:40px;max-width:780px;margin:0 auto;color:#1a1a1a}
      .header{text-align:center;margin-bottom:20px} .header h2{color:#0d9488;margin:0;font-size:20px} .header p{font-size:12px;color:#888}
      h1{font-size:18px;text-align:center;border-bottom:2px solid #0d9488;padding-bottom:10px}
      table{width:100%;border-collapse:collapse;margin:20px 0} th,td{border:1px solid #e5e7eb;padding:8px 12px;text-align:left;font-size:13px}
      th{background:#f8fafc;font-weight:600;color:#374151} .total-row{background:#f0fdfa;font-weight:600}
      .footer{margin-top:30px;font-size:12px;color:#666} @media print{body{padding:20px}}</style></head><body>
      <div class="header"><h2>OdontoFace Clínica</h2><p>Odontologia & Harmonização Orofacial</p></div>
      <h1>Orçamento</h1>
      <p><strong>Paciente:</strong> ${patientName}<br><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
      <table><thead><tr><th>#</th><th>Código</th><th>Procedimento</th><th>Valor</th><th>Desconto</th><th>Total</th></tr></thead>
      <tbody>${tableRows}
      <tr class="total-row"><td colspan="4"></td><td>Desconto Total</td><td>R$ ${totalDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
      <tr class="total-row"><td colspan="4"></td><td><strong>TOTAL</strong></td><td><strong>R$ ${grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td></tr>
      </tbody></table>
      <p><strong>Condições:</strong> ${paymentCondition}</p>
      <p class="footer">Validade: 30 dias.<br><br>_____________________________<br>OdontoFace Clínica</p>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  // ═══ SUB-VIEW: Tabela de Preços ═══
  if (view === 'prices') {
    return (
      <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
        <div className="card-body">
          <InlineFormHeader title="Tabela de Preços de Procedimentos" onBack={() => setView('budget')} />
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 'var(--space-4)' }}>
            Sempre inserção — o último cadastro com mesmo nome torna-se o preço ativo.
          </p>

          {/* New price form */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px auto', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
            <input className="input" placeholder="Código" value={newPrice.code} onChange={(e) => setNewPrice({ ...newPrice, code: e.target.value })} style={{ fontSize: 'var(--text-xs)' }} />
            <input className="input" placeholder="Nome do procedimento" value={newPrice.name} onChange={(e) => setNewPrice({ ...newPrice, name: e.target.value })} style={{ fontSize: 'var(--text-xs)' }} />
            <input className="input" type="number" placeholder="Valor" min="0" step="0.01" value={newPrice.price} onChange={(e) => setNewPrice({ ...newPrice, price: e.target.value })} style={{ fontSize: 'var(--text-xs)' }} />
            <button className="btn btn-primary btn-sm" onClick={addNewPrice} disabled={!newPrice.code || !newPrice.name || !newPrice.price}>
              <Plus size={14} /> Inserir
            </button>
          </div>

          {/* Price table */}
          <div className="table-container">
            <table className="table" style={{ fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr>
                  <th>Código</th><th>Procedimento</th><th>Valor (R$)</th><th>Criação</th><th>Usuário</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...prices].reverse().map((p) => (
                  <tr key={p.id} style={{ opacity: p.status === 'INATIVO' ? 0.4 : 1 }}>
                    <td style={{ fontFamily: 'monospace' }}>{p.code}</td>
                    <td>{p.name}</td>
                    <td style={{ fontWeight: 600 }}>R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td>{p.createdBy}</td>
                    <td>
                      <span className={`badge ${p.status === 'ATIVO' ? 'badge-success' : 'badge-secondary'}`} style={{ fontSize: '10px' }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ═══ SUB-VIEW: Campanhas ═══
  if (view === 'campaigns') {
    return (
      <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
        <div className="card-body">
          <InlineFormHeader title="Campanhas de Desconto" onBack={() => setView('budget')} />
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 'var(--space-4)' }}>
            Gerencie campanhas promocionais para envio via WhatsApp ou E-mail.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {campaigns.map((c) => {
              const isActive = c.active && new Date(c.startDate) <= new Date() && new Date(c.endDate) >= new Date();
              return (
                <div key={c.id} style={{
                  padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${isActive ? 'var(--success-200)' : 'var(--gray-100)'}`,
                  background: isActive ? 'var(--success-25)' : 'white',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{c.name}</div>
                    <span className={`badge ${isActive ? 'badge-success' : 'badge-secondary'}`} style={{ fontSize: '10px' }}>
                      {isActive ? '🟢 Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--gray-600)' }}>
                    <div><strong>Desconto:</strong> {c.discountType === 'PERCENTUAL' ? `${c.discountValue}%` : `R$ ${c.discountValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</div>
                    <div><strong>Início:</strong> {new Date(c.startDate).toLocaleDateString('pt-BR')}</div>
                    <div><strong>Fim:</strong> {new Date(c.endDate).toLocaleDateString('pt-BR')}</div>
                    <div><strong>Canal:</strong> {c.channel === 'WHATSAPP' ? '📱 WhatsApp' : c.channel === 'EMAIL' ? '📧 E-mail' : '📱📧 Ambos'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ═══ MAIN VIEW: Budget Builder ═══
  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <InlineFormHeader title="Gerar Orçamento" onBack={onDone} />

        {/* Quick access buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setView('prices')}>
            📋 Tabela de Preços
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setView('campaigns')}>
            🏷️ Campanhas ({activeCampaigns.length} ativa{activeCampaigns.length !== 1 ? 's' : ''})
          </button>
        </div>

        {/* Procedure selection (only from registered prices) */}
        <Field label="Selecione os procedimentos (tabela de preços)" span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-1)' }}>
            {Array.from(activePrices.values()).map((proc) => {
              const selected = lines.some((l) => l.procId === proc.id);
              return (
                <label key={proc.id} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', fontSize: 'var(--text-xs)',
                  background: selected ? 'var(--primary-50)' : 'transparent',
                  color: selected ? 'var(--primary-700)' : 'var(--gray-600)',
                  transition: 'all 0.1s ease',
                }}>
                  <input type="checkbox" checked={selected} onChange={() => selected ? removeLine(proc.id) : addLine(proc)}
                    style={{ width: 14, height: 14, accentColor: 'var(--primary-500)' }} />
                  <span style={{ flex: 1 }}>{proc.name}</span>
                  <span style={{ fontWeight: 600, color: 'var(--success-700)', fontSize: '11px' }}>
                    R$ {proc.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </label>
              );
            })}
          </div>
        </Field>

        {/* Budget lines table */}
        {lines.length > 0 && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--gray-500)', marginBottom: 'var(--space-2)', textTransform: 'uppercase' }}>
              Itens do Orçamento
            </div>
            <div className="table-container">
              <table className="table" style={{ fontSize: 'var(--text-xs)' }}>
                <thead>
                  <tr>
                    <th>#</th><th>Código</th><th>Procedimento</th><th>Valor</th><th>Desconto</th><th>Total</th><th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => {
                    const disc = calcLineDiscount(line);
                    const total = calcLineTotal(line);
                    return (
                      <tr key={line.procId}>
                        <td>{i + 1}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{line.code}</td>
                        <td>{line.name}</td>
                        <td>R$ {line.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                            <select className="input" value={line.discountType === 'CAMPANHA' ? `CAMP_${line.campaignId}` : line.discountType} onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'CAMPANHA') return;
                              if (val.startsWith('CAMP_')) {
                                applyLineCampaign(line.procId, val.replace('CAMP_', ''));
                                return;
                              }
                              updateLine(line.procId, 'discountType', val);
                              if (val === 'NENHUM') updateLine(line.procId, 'discountValue', 0);
                            }} style={{ fontSize: '11px', height: 28, minWidth: 90, maxWidth: 160, width: 'auto', padding: '0 4px' }}>
                              <option value="NENHUM">Nenhum</option>
                              <option value="PERCENTUAL">%</option>
                              <option value="FIXO">R$ Fixo</option>
                              {activeCampaigns.length > 0 && <option value="CAMPANHA" disabled>── Campanhas ──</option>}
                              {activeCampaigns.map((c) => (
                                <option key={c.id} value={`CAMP_${c.id}`}>🏷️ {c.name}</option>
                              ))}
                            </select>
                            {(line.discountType === 'PERCENTUAL' || line.discountType === 'FIXO') && (
                              <input className="input" type="number" min="0" step="0.01" value={line.discountValue}
                                onChange={(e) => updateLine(line.procId, 'discountValue', parseFloat(e.target.value) || 0)}
                                style={{ width: 70, fontSize: '11px', height: 28, padding: '0 4px' }} />
                            )}
                            {line.discountType === 'CAMPANHA' && (
                              <span style={{ fontSize: '10px', color: 'var(--success-600)' }}>
                                {campaigns.find((c) => c.id === line.campaignId)?.discountType === 'PERCENTUAL'
                                  ? `${line.discountValue}%` : `R$ ${line.discountValue}`}
                              </span>
                            )}
                            {disc > 0 && <span style={{ fontSize: '10px', color: 'var(--error-500)' }}>-R$ {disc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--success-700)' }}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => removeLine(line.procId)} style={{ color: 'var(--error-500)' }}>
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totals */}
                  {totalDiscount > 0 && (
                    <tr style={{ background: 'var(--warning-50)' }}>
                      <td colSpan={4}></td>
                      <td style={{ fontSize: '11px', color: 'var(--error-600)' }}>Desconto Total</td>
                      <td style={{ fontWeight: 600, color: 'var(--error-600)' }}>- R$ {totalDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td></td>
                    </tr>
                  )}
                  <tr style={{ background: 'var(--primary-50)' }}>
                    <td colSpan={4}></td>
                    <td style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>TOTAL</td>
                    <td style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--primary-700)' }}>R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment condition */}
        <div className="grid grid-2" style={{ marginTop: 'var(--space-4)' }}>
          <Field label="Condições de pagamento">
            <select className="input" value={paymentCondition} onChange={(e) => setPaymentCondition(e.target.value)}>
              <option>PIX</option>
              <option>Cartão de Crédito</option>
              <option>Cartão de Débito</option>
              <option>Dinheiro</option>
              <option>Boleto</option>
              <option>PIX + Cartão</option>
              <option>2x no Cartão</option>
              <option>3x no Cartão</option>
              <option>Personalizado</option>
            </select>
          </Field>
          <Field label="Validade">
            <input className="input" value="30 dias" readOnly style={{ background: 'var(--gray-25)' }} />
          </Field>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
          <button className="btn btn-secondary" onClick={onDone}>Cancelar</button>
          <button className="btn btn-primary" onClick={handlePrint} disabled={lines.length === 0}>
            <FileText size={14} /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Generic Document (inline) ───────────────────────────────────────────────
function NewDocumentInline({ patientName, patientId, onDone }: { patientName: string; patientId: string; onDone: () => void }) {
  const [docType, setDocType] = useState('TERMO_CONSENTIMENTO');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState(DOC_TEMPLATES.TERMO_CONSENTIMENTO(patientName));
  const [selectedProcs, setSelectedProcs] = useState<string[]>([]);
  const [customProc, setCustomProc] = useState('');
  const { mutate: createDocument } = useCreateDocument();
  const { data: medsData } = useMedications();
  const medications = medsData?.data || [];

  // If ORCAMENTO selected, render BudgetBuilder instead
  if (docType === 'ORCAMENTO') {
    return <BudgetBuilder patientName={patientName} patientId={patientId} onDone={onDone} />;
  }

  const updateBodyProcedures = (procs: string[]) => {
    const procText = procs.join('; ');
    const fallbackText = '_________________________________';
    
    setBody((prev) => {
      const templateStr = DOC_TEMPLATES[docType]?.('') || '';
      const nativeHasProcLine = /(Procedimento|Procedimentos):/.test(templateStr);
      const hasProcLine = /(Procedimento|Procedimentos):.*/.test(prev);
      
      if (hasProcLine) {
        if (procs.length === 0 && !nativeHasProcLine) {
          return prev.replace(/\n*Procedimentos:.*/, '');
        } else {
          return prev.replace(/(Procedimento|Procedimentos):.*/, `Procedimentos: ${procs.length ? procText : fallbackText}`);
        }
      } else {
        if (procs.length > 0) {
           const dataRegex = /(Data: \d{2}\/\d{2}\/\d{4})/;
           const dataMatch = prev.match(dataRegex);
           if (dataMatch && dataMatch.index !== undefined) {
             const insertPos = dataMatch.index + dataMatch[0].length;
             const before = prev.substring(0, insertPos);
             const after = prev.substring(insertPos);
             return `${before}\n\nProcedimentos: ${procText}${after}`;
           }

           const sigRegex = /_{20,}\s*\n\s*(Dr\(a\)|OdontoFace|Assinatura)/;
           const match = prev.match(sigRegex);
           if (match && match.index !== undefined) {
             const before = prev.substring(0, match.index).trimEnd();
             const after = prev.substring(match.index);
             return `${before}\n\nProcedimentos: ${procText}\n\n\n${after}`;
           }
           return prev + `\n\nProcedimentos: ${procText}`;
        }
      }
      return prev;
    });
  };

  const toggleProc = (proc: string) => {
    setSelectedProcs((prev) => {
      const next = prev.includes(proc) ? prev.filter((p) => p !== proc) : [...prev, proc];
      updateBodyProcedures(next);
      return next;
    });
  };

  const addCustomProc = () => {
    if (!customProc.trim()) return;
    const trimmed = customProc.trim();
    if (!selectedProcs.includes(trimmed)) {
      setSelectedProcs((prev) => {
        const next = [...prev, trimmed];
        updateBodyProcedures(next);
        return next;
      });
    }
    setCustomProc('');
  };

  const handleTypeChange = (type: string) => {
    setDocType(type);
    if (type === 'ORCAMENTO') return; // will render BudgetBuilder
    const template = DOC_TEMPLATES[type];
    if (template) setBody(template(patientName));
    setTitle(DOC_TYPES.find((d) => d.value === type)?.label ?? '');
    setSelectedProcs([]);
  };

  const handleAddMedication = (medId: string) => {
    const med = medications.find((m: any) => String(m.id) === medId);
    if (!med) return;

    let medBlock = `${med.name} ${med.concentration ? `(${med.concentration})` : ''}\n   Posologia: ${med.defaultDosage || '__________________________________'}`;
    if (med.defaultInstructions) {
      medBlock += `\n   Instruções: ${med.defaultInstructions}`;
    }
    
    // Try to replace the empty numbered slots (1., 2., 3.) first
    if (body.includes('1. ____________________________________________\n   Posologia: __________________________________')) {
       setBody(body.replace('1. ____________________________________________\n   Posologia: __________________________________', `1. ${medBlock}`));
    } else if (body.includes('2. ____________________________________________\n   Posologia: __________________________________')) {
       setBody(body.replace('2. ____________________________________________\n   Posologia: __________________________________', `2. ${medBlock}`));
    } else if (body.includes('3. ____________________________________________\n   Posologia: __________________________________')) {
       setBody(body.replace('3. ____________________________________________\n   Posologia: __________________________________', `3. ${medBlock}`));
    } else {
       // Otherwise just append it above the signature
       const sigRegex = /_{20,}\s*\n\s*(Dr\(a\)|OdontoFace|Assinatura)/;
       const match = body.match(sigRegex);
       if (match && match.index !== undefined) {
         const before = body.substring(0, match.index).trimEnd();
         const after = body.substring(match.index);
         setBody(`${before}\n\n- ${medBlock}\n\n\n${after}`);
       } else {
         setBody(body + `\n\n- ${medBlock}`);
       }
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const docLabel = title || DOC_TYPES.find((d) => d.value === docType)?.label || 'Documento';
    
    // Save to DB
    createDocument({
      type: docType,
      patientId: patientId,
      title: docLabel,
      content: { text: body, type: docType }
    });

    printWindow.document.write(`
      <html><head><title>${docLabel}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; color: #1a1a1a; line-height: 1.6; }
        h1 { font-size: 18px; text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0d9488; padding-bottom: 10px; }
        pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h2 { font-size: 20px; color: #0d9488; margin: 0; }
        .header p { font-size: 12px; color: #888; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header"><h2>OdontoFace Clínica</h2><p>Odontologia & Harmonização Orofacial</p></div>
      <h1>${docLabel}</h1>
      <pre>${body}</pre>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <InlineFormHeader title="Gerar Documento" onBack={onDone} />
        <div className="grid grid-2">
          <Field label="Tipo de documento">
            <select className="input" value={docType} onChange={(e) => handleTypeChange(e.target.value)}>
              {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>
          <Field label="Título personalizado (opcional)">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={DOC_TYPES.find((d) => d.value === docType)?.label} />
          </Field>
          {/* Procedure multi-select */}
          <Field label="Procedimento(s)" span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-1)' }}>
              {getFilteredProcedures(docType).map((proc) => (
                <label key={proc} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: 'var(--space-1-5) var(--space-2)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', fontSize: 'var(--text-xs)',
                  background: selectedProcs.includes(proc) ? 'var(--primary-50)' : 'transparent',
                  color: selectedProcs.includes(proc) ? 'var(--primary-700)' : 'var(--gray-600)',
                  transition: 'all 0.1s ease',
                }}>
                  <input type="checkbox" checked={selectedProcs.includes(proc)} onChange={() => toggleProc(proc)}
                    style={{ width: 14, height: 14, accentColor: 'var(--primary-500)' }} />
                  {proc}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <input className="input" value={customProc} onChange={(e) => setCustomProc(e.target.value)}
                placeholder="Outro procedimento..." onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomProc())}
                style={{ flex: 1 }} />
              <button className="btn btn-secondary btn-sm" type="button" onClick={addCustomProc}>
                <Plus size={12} /> Adicionar
              </button>
            </div>
            {selectedProcs.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
                {selectedProcs.map((p) => (
                  <span key={p} className="badge badge-primary" style={{ cursor: 'pointer', fontSize: '11px' }} onClick={() => toggleProc(p)}>
                    {p} ✕
                  </span>
                ))}
              </div>
            )}
          </Field>

          {/* Conditional field for Medication Selection when type is RECEITA */}
          {docType === 'RECEITA' && (
            <Field label="Adicionar Medicamento ao Documento" span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <select className="input" style={{ flex: 1 }} onChange={(e) => { 
                    if (e.target.value) { 
                       handleAddMedication(e.target.value); 
                       e.target.value = ''; 
                    } 
                }}>
                  <option value="">Selecione um medicamento para preencher...</option>
                  {medications.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name} {m.concentration ? `(${m.concentration})` : ''}</option>
                  ))}
                </select>
              </div>
            </Field>
          )}

          <Field label="Conteúdo do documento" span>
            <textarea
              className="input"
              rows={14}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 'var(--text-sm)', lineHeight: '1.6' }}
            />
          </Field>
        </div>

        {/* Preview card */}
        <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>Pré-visualização</div>
          <div style={{ background: 'white', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', maxHeight: 200, overflow: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{ fontWeight: 'var(--font-bold)', color: 'var(--primary-600)' }}>OdontoFace Clínica</div>
              <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>Odontologia & Harmonização Orofacial</div>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 'var(--text-xs)', color: 'var(--gray-700)', margin: 0, lineHeight: '1.5' }}>{body}</pre>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
          <button className="btn btn-secondary" onClick={onDone}>Cancelar</button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <FileText size={14} /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: patient, isLoading, isError } = usePatient(id);
  const { data: recordsData } = useMedicalRecords(id);
  const { data: schedulesData } = useSchedules({ patientId: id });
  const { data: photosData } = usePatientPhotos(id);
  const { data: documentsData } = useDocuments({ patientId: id });
  const { data: financesData } = useFinances({ patientId: id });
  const { data: anamnesesData } = useAnamneses(id);

  const [activeTab, setActiveTab] = useState('prontuario');
  const [editing, setEditing] = useState(false);

  // Inline form toggles — one per tab
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [showUploadPhoto, setShowUploadPhoto] = useState(false);
  const [showNewDocument, setShowNewDocument] = useState(false);
  const [showNewAnamnesis, setShowNewAnamnesis] = useState(false);
  const [showNewFinance, setShowNewFinance] = useState(false);
  const [showNewSchedule, setShowNewSchedule] = useState(false);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-20)', gap: 'var(--space-4)', color: 'var(--gray-400)' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 'var(--text-sm)' }}>Carregando dados do paciente...</span>
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-20)', gap: 'var(--space-4)' }}>
        <div style={{ fontSize: '48px' }}>😕</div>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', color: 'var(--gray-900)' }}>Paciente não encontrado</h2>
        <p style={{ color: 'var(--gray-400)', fontSize: 'var(--text-sm)' }}>O registro com ID <code>{id}</code> não existe ou foi removido.</p>
        <Link href="/pacientes" className="btn btn-primary"><ArrowLeft size={16} /> Voltar para Pacientes</Link>
      </div>
    );
  }

  const age = calcAge(patient.birthDate);
  const gender = GENDER_LABEL[patient.gender] ?? patient.gender;
  const ini = initials(patient.name);
  
  // Safe extraction (handles both raw arrays and `{ data: [] }` paginated responses)
  const records = (recordsData as any)?.data ?? recordsData ?? [];
  const schedules = (schedulesData as any)?.data ?? schedulesData ?? [];
  const photos = (photosData as any)?.data ?? photosData ?? [];
  const documents = (documentsData as any)?.data ?? documentsData ?? [];
  const finances = (financesData as any)?.data ?? financesData ?? [];
  const anamneses = (anamnesesData as any)?.data ?? anamnesesData ?? [];
  
  const counters = patient._count ?? {};

  return (
    <>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link href="/pacientes" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--gray-400)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Voltar para pacientes
        </Link>

        {/* ── Edit Patient inline ──────────────────── */}
        {editing ? (
          <EditPatientInline patient={patient as Record<string, unknown>} onDone={() => setEditing(false)} />
        ) : (
          /* Patient Header Card */
          <div className="card" style={{ animation: 'fadeInUp 0.35s ease' }}>
            <div className="card-body" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Avatar + Name */}
                <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center', flex: 1, minWidth: '280px' }}>
                  <div className="avatar avatar-2xl" style={{ fontSize: '20px', fontWeight: 'var(--font-bold)' }}>{ini}</div>
                  <div>
                    <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--gray-900)', marginBottom: 'var(--space-1)' }}>{patient.name}</h1>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--gray-500)', flexWrap: 'wrap' }}>
                      {age !== null && <span>{age} anos</span>}
                      {patient.gender && patient.gender !== 'NAO_INFORMADO' && <span>• {gender}</span>}
                      {patient.cpf && <span>CPF: {patient.cpf}</span>}
                      {patient.birthDate && <span>Nasc: {new Date(patient.birthDate as string).toLocaleDateString('pt-BR')}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                      <span className={`badge badge-dot ${patient.status === 'ATIVO' ? 'badge-success' : 'badge-neutral'}`}>
                        {patient.status === 'ATIVO' ? 'Ativo' : patient.status === 'INATIVO' ? 'Inativo' : 'Arquivado'}
                      </span>
                      {patient.healthInsurance && <span className="badge badge-primary">{patient.healthInsurance as string}</span>}
                      {patient.origin && <span className="badge badge-neutral">{patient.origin as string}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
                      {[
                        { label: 'Prontuários', value: counters.medicalRecords ?? 0 },
                        { label: 'Fotos', value: counters.photos ?? 0 },
                        { label: 'Documentos', value: counters.documents ?? 0 },
                        { label: 'Financeiro', value: counters.finances ?? 0 },
                      ].map((c) => (
                        <div key={c.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--primary-600)' }}>{c.value}</div>
                          <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{c.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Contact */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
                  {patient.phoneMain && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Phone size={14} style={{ color: 'var(--gray-400)' }} /> {patient.phoneMain as string}</div>}
                  {patient.email && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Mail size={14} style={{ color: 'var(--gray-400)' }} /> {patient.email as string}</div>}
                  {patient.address && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><MapPin size={14} style={{ color: 'var(--gray-400)' }} /> {patient.address as string}{patient.city ? `, ${patient.city}` : ''}{patient.state ? `/${patient.state}` : ''}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Clock size={14} style={{ color: 'var(--gray-400)' }} /> Paciente desde {fmtDate(patient.createdAt as string)}</div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Edit size={14} /> Editar</button>
                  <button className="btn btn-primary btn-sm" onClick={() => { setActiveTab('prontuario'); setShowNewRecord(true); }}><Plus size={14} /> Novo Atendimento</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setShowNewRecord(false); setShowUploadPhoto(false); setShowNewDocument(false); setShowNewAnamnesis(false); setShowNewFinance(false); setShowNewSchedule(false); }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}><Icon size={15} /> {tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB CONTENTS — each shows inline form OR list
         ══════════════════════════════════════════════════════════════════════ */}

      {/* ── PRONTUÁRIO ─────────────────────────────────────────────────── */}
      {activeTab === 'prontuario' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          {showNewRecord ? (
            <NewRecordInline patientId={id} onDone={() => setShowNewRecord(false)} />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Histórico de Atendimentos</h3>
                {records.length > 0 && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowNewRecord(true)}><Plus size={14} /> Novo Atendimento</button>
                )}
              </div>
              {records.length === 0 ? (
                <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}>
                  <FileText size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
                  <p style={{ fontSize: 'var(--text-sm)' }}>Nenhum atendimento registrado</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }} onClick={() => setShowNewRecord(true)}><Plus size={14} /> Realizar Atendimento</button>
                </div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {records.map((r: Record<string, unknown>, i: number) => (
                    <div key={String(r.id)} className="card" style={{ animation: `fadeInUp 0.3s ease backwards ${i * 80}ms` }}>
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <span className="badge badge-primary">{String(r.procedures ?? 'Atendimento')}</span>
                            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>{new Date(String(r.dateTime ?? r.createdAt)).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <span className={`badge badge-dot ${r.isDraft ? 'badge-warning' : 'badge-success'}`}>{r.isDraft ? 'Rascunho' : 'Finalizado'}</span>
                        </div>
                        {Boolean(r.complaint) && <div style={{ marginBottom: 'var(--space-2)' }}><div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 2 }}>Queixa</div><p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>{typeof r.complaint === 'string' ? r.complaint : String(r.complaint)}</p></div>}
                        {Boolean(r.diagnosis) && <div><div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 2 }}>Diagnóstico</div><p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>{typeof r.diagnosis === 'string' ? r.diagnosis : String(r.diagnosis)}</p></div>}
                        {Boolean(r.treatment) && <div style={{ marginTop: 'var(--space-2)' }}><div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 2 }}>Tratamento</div><p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>{typeof r.treatment === 'string' ? r.treatment : String(r.treatment)}</p></div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── FOTOS ────────────────────────────────────────────────────── */}
      {activeTab === 'fotos' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          {showUploadPhoto ? (
            <UploadPhotoInline patientId={id} onDone={() => setShowUploadPhoto(false)} />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Galeria de Fotos</h3>
                {photos.length > 0 && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowUploadPhoto(true)}><Camera size={14} /> Upload</button>
                )}
              </div>
              
              {photos.length === 0 ? (
                <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}>
                  <Camera size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
                  <p style={{ fontSize: 'var(--text-sm)' }}>Nenhuma foto cadastrada</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }} onClick={() => setShowUploadPhoto(true)}><Upload size={14} /> Adicionar Foto</button>
                </div></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--space-4)' }}>
                  {photos.map((p: Record<string, unknown>, i: number) => {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                    const src = p.url ? String(p.url) : `${apiUrl}/api/photos/${p.id}/content`;
                    return (
                      <div key={String(p.id)} style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '1', background: 'var(--gray-100)', animation: `fadeIn 0.3s ease backwards ${i * 50}ms` }}>
                        <img src={src} alt={String(p.title ?? 'Foto')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'var(--space-2)', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: 'white', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{String(p.title ?? p.category ?? 'Sem título')}</span>
                          <span style={{ opacity: 0.8 }}>{new Date(String(p.createdAt)).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div style={{ position: 'absolute', top: 6, right: 6 }}>
                          <span className="badge badge-primary" style={{ fontSize: '9px', padding: '2px 4px' }}>{String(p.category ?? 'BEFORE')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── DOCUMENTOS ──────────────────────────────────────────────── */}
      {activeTab === 'documentos' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          {showNewDocument ? (
            <NewDocumentInline patientName={patient.name as string} patientId={id} onDone={() => setShowNewDocument(false)} />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Documentos</h3>
                {documents.length > 0 && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowNewDocument(true)}><Plus size={14} /> Gerar Documento</button>
                )}
              </div>
              {documents.length === 0 ? (
                <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}>
                  <FolderOpen size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
                  <p style={{ fontSize: 'var(--text-sm)' }}>Nenhum documento gerado</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }} onClick={() => setShowNewDocument(true)}><Plus size={14} /> Gerar Documento</button>
                </div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {documents.map((doc: any, i: number) => (
                    <div key={doc.id} className="card" style={{ animation: `fadeInUp 0.3s ease backwards ${i * 80}ms` }}>
                      <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ padding: 'var(--space-2)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                            <FileText size={20} style={{ color: 'var(--gray-500)' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--gray-900)' }}>{doc.title || doc.type}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span className={`badge badge-dot ${doc.status === 'ASSINADO' ? 'badge-success' : 'badge-warning'}`}>{doc.status === 'ASSINADO' ? 'Assinado' : 'Pendente'}</span>
                          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/documents/${doc.id}/pdf`} target="_blank" className="btn btn-ghost btn-sm btn-icon" title="Imprimir / Baixar">
                            <Printer size={16} />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── ANAMNESE ────────────────────────────────────────────────── */}
      {activeTab === 'anamnese' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          {showNewAnamnesis ? (
            <NewAnamnesisInline patientId={id} onDone={() => setShowNewAnamnesis(false)} />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Ficha de Anamnese</h3>
                {anamneses.length > 0 && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowNewAnamnesis(true)}><Plus size={14} /> Nova Anamnese</button>
                )}
              </div>
              {anamneses.length === 0 ? (
                <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}>
                  <Stethoscope size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
                  <p style={{ fontSize: 'var(--text-sm)' }}>Nenhuma anamnese registrada</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }} onClick={() => setShowNewAnamnesis(true)}><Plus size={14} /> Realizar Anamnese</button>
                </div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {anamneses.map((anamnese: any, index: number) => (
                    <div key={anamnese.id} className="card" style={{ animation: `fadeInUp 0.3s ease backwards ${index * 80}ms` }}>
                      <div className="card-body">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <CheckCircle size={16} style={{ color: 'var(--success-500)' }} />
                            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-900)', fontWeight: 'var(--font-medium)' }}>
                              Preenchida em: {fmtDate(String(anamnese.filledAt ?? anamnese.createdAt ?? ''))}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            {anamnese.status && <span className={`badge badge-dot ${anamnese.status === 'ASSINADO' ? 'badge-success' : 'badge-warning'}`}>{anamnese.status}</span>}
                            <button className="btn btn-ghost btn-sm btn-icon" title="Ver completo">
                              <ExternalLink size={14} />
                            </button>
                          </div>
                        </div>
                        
                        {(anamnese.data || anamnese.content) && typeof (anamnese.data || anamnese.content) === 'object' && (() => {
                          const raw = anamnese.data || anamnese.content;
                          const entries = Object.entries(raw);
                          // Detect API format: {q01_xxx: {pergunta, resposta}} vs wizard format {key: value}
                          const isApiFormat = entries.length > 0 && typeof entries[0][1] === 'object' && entries[0][1] !== null && 'pergunta' in (entries[0][1] as Record<string, unknown>);
                          
                          if (isApiFormat) {
                            // Sort by key (q01, q02, ...) to ensure order
                            const sorted = entries.sort(([a], [b]) => a.localeCompare(b));
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                                {sorted.map(([key, val]: [string, any], i: number) => {
                                  const resp = String(val.resposta || '').toLowerCase();
                                  const isYes = resp === 'sim' || resp.startsWith('sim');
                                  const isNo = resp === 'nao' || resp === 'não' || resp.startsWith('nao') || resp.startsWith('não');
                                  return (
                                    <div key={key} style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                      padding: 'var(--space-3) var(--space-4)',
                                      background: i % 2 === 0 ? 'var(--gray-25)' : 'white',
                                      borderBottom: i < sorted.length - 1 ? '1px solid var(--gray-50)' : 'none',
                                    }}>
                                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)', flex: 1 }}>
                                        {val.pergunta || key.replace(/_/g, ' ').replace(/^q\d+\s*/, '')}
                                      </span>
                                      <span style={{
                                        fontSize: 'var(--text-xs)', fontWeight: 600,
                                        padding: '2px 10px', borderRadius: 'var(--radius-full)',
                                        background: isYes ? 'var(--warning-50, #fffbeb)' : isNo ? 'var(--success-50, #f0fdf4)' : 'var(--gray-100)',
                                        color: isYes ? 'var(--warning-700, #a16207)' : isNo ? 'var(--success-700, #15803d)' : 'var(--gray-700)',
                                      }}>
                                        {String(val.resposta || '—')}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }
                          
                          // Wizard format: flat {key: boolean | string}
                          const LABELS: Record<string, string> = {
                            cardiopatia: 'Cardiopatia', hipertensao: 'Hipertensão', diabetes: 'Diabetes',
                            hepatite: 'Hepatite', hiv: 'HIV', gravidez: 'Gravidez', anemia: 'Anemia',
                            hemorragia: 'Hemorragias', convulsao: 'Convulsões', rinite: 'Rinite/Sinusite',
                            asma: 'Asma', febre_reumatica: 'Febre Reumática', pressao: 'Pressão Arterial',
                            tipo_sanguineo: 'Tipo Sanguíneo', alergias: 'Alergias', medicamentos: 'Medicamentos',
                            anticoagulante: 'Anticoagulante', suplementos: 'Suplementos',
                            tabagismo: 'Tabagismo', etilismo: 'Etilismo', bruxismo: 'Bruxismo',
                            respiracao: 'Respiração', observacoes: 'Observações',
                          };
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                              {entries.filter(([k]) => !k.endsWith('_detail')).map(([key, val], i: number) => (
                                <div key={key} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: 'var(--space-3) var(--space-4)',
                                  background: i % 2 === 0 ? 'var(--gray-25)' : 'white',
                                  borderBottom: '1px solid var(--gray-50)',
                                }}>
                                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)', flex: 1 }}>
                                    {LABELS[key] || key.replace(/_/g, ' ')}
                                  </span>
                                  <span style={{
                                    fontSize: 'var(--text-xs)', fontWeight: 600,
                                    padding: '2px 10px', borderRadius: 'var(--radius-full)',
                                    background: val === true ? 'var(--warning-50, #fffbeb)' : val === false ? 'var(--success-50, #f0fdf4)' : 'var(--gray-100)',
                                    color: val === true ? 'var(--warning-700, #a16207)' : val === false ? 'var(--success-700, #15803d)' : 'var(--gray-700)',
                                  }}>
                                    {val === true ? 'Sim' : val === false ? 'Não' : String(val || '—')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                        {!anamnese.data && !anamnese.content && (
                           <div style={{ padding: 'var(--space-3)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
                             Sem dados detalhados.
                           </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── FINANCEIRO ──────────────────────────────────────────────── */}
      {activeTab === 'financeiro' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          {showNewFinance ? (
            <NewFinanceInline patientId={id} onDone={() => setShowNewFinance(false)} />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Histórico Financeiro</h3>
                {finances.length > 0 && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowNewFinance(true)}><Plus size={14} /> Novo Lançamento</button>
                )}
              </div>
              {finances.length === 0 ? (
                <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}>
                  <DollarSign size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
                  <p style={{ fontSize: 'var(--text-sm)' }}>Nenhum lançamento financeiro</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }} onClick={() => setShowNewFinance(true)}><Plus size={14} /> Realizar Lançamento</button>
                </div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {finances.map((fin: any, i: number) => (
                    <div key={fin.id} className="card" style={{ animation: `fadeInUp 0.3s ease backwards ${i * 80}ms` }}>
                      <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                           <div style={{ fontWeight: 'var(--font-semibold)', color: fin.type === 'RECEBIMENTO' ? 'var(--success-600)' : 'var(--error-600)', marginBottom: 2 }}>
                             R$ {Number(fin.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </div>
                           <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{fin.description}</div>
                         </div>
                         <div style={{ textAlign: 'right' }}>
                           <span className={`badge badge-dot ${fin.status === 'PAGO' ? 'badge-success' : 'badge-warning'}`}>{fin.status}</span>
                           <div style={{ fontSize: '10px', color: 'var(--gray-400)', marginTop: '4px' }}>Vencimento: {new Date(fin.dueDate).toLocaleDateString('pt-BR')}</div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── AGENDAMENTOS ───────────────────────────────────────────── */}
      {activeTab === 'agendamentos' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          {showNewSchedule ? (
            <NewScheduleInline patientId={id} patientName={patient.name as string} onDone={() => setShowNewSchedule(false)} />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Agendamentos</h3>
                {schedules.length > 0 && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowNewSchedule(true)}><Plus size={14} /> Novo Agendamento</button>
                )}
              </div>
              {schedules.length === 0 ? (
                <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}>
                  <Calendar size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
                  <p style={{ fontSize: 'var(--text-sm)' }}>Nenhum agendamento encontrado</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }} onClick={() => setShowNewSchedule(true)}><Plus size={14} /> Realizar Agendamento</button>
                </div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {schedules.map((appt: Record<string, unknown>, i: number) => {
                    const isUpcoming = !['CONCLUIDO', 'CANCELADO', 'FALTOU'].includes(String(appt.status));
                    const startAt = appt.startAt ? new Date(String(appt.startAt)) : null;
                    return (
                      <div key={String(appt.id)} className="card" style={{ animation: `fadeInUp 0.2s ease backwards ${i * 50}ms`, border: isUpcoming ? '1px solid var(--primary-200)' : undefined }}>
                        <div className="card-body" style={{ padding: 'var(--space-4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                              {startAt && (
                                <div style={{ width: 48, minWidth: 48, height: 48, borderRadius: 'var(--radius-lg)', background: isUpcoming ? 'var(--primary-50)' : 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 'var(--font-bold)', color: isUpcoming ? 'var(--primary-700)' : 'var(--gray-500)', lineHeight: 1 }}>{startAt.getDate().toString().padStart(2, '0')}</div>
                                  <div style={{ fontSize: '9px', color: isUpcoming ? 'var(--primary-500)' : 'var(--gray-400)' }}>{['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][startAt.getMonth()]}</div>
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{String(appt.notes ?? 'Consulta')}</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>{startAt?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                              </div>
                            </div>
                            <span className={`badge badge-dot ${['CONCLUIDO'].includes(String(appt.status)) ? 'badge-success' : isUpcoming ? 'badge-primary' : 'badge-neutral'}`}>{String(appt.status)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
