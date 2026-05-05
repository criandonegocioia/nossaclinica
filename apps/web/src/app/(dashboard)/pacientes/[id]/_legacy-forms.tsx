'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft, Save, FileText, Plus, CheckCircle, Heart, Pill, ClipboardList, Eye, X,
  Calendar, DollarSign, Banknote, Smartphone, CreditCard, Building2, Upload,
} from 'lucide-react';
import {
  useCreateAnamnesis, useUpdateAnamnesis, useCreateDocument, useMedications,
  useCreateFinance, useCreateSchedule, useUsers, useRooms, useProcedures,
} from '@/hooks/useApi';

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'PIX', CARTAO_CREDITO: 'Cartão Crédito', CARTAO_DEBITO: 'Cartão Débito',
  DINHEIRO: 'Dinheiro', BOLETO: 'Boleto', TRANSFERENCIA: 'Transferência',
};

// Re-used primitives (also exported from shared/ui but kept here for legacy self-containment)
function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className="input-group" style={span ? { gridColumn: 'span 2' } : undefined}>
      <label className="input-label">{label}</label>
      {children}
    </div>
  );
}

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
  { key: 'saude', title: 'Saúde Geral', icon: Heart },
  { key: 'alergias', title: 'Alergias e Medicações', icon: Pill },
  { key: 'historico', title: 'Histórico Médico', icon: ClipboardList },
  { key: 'habitos', title: 'Hábitos e Observações', icon: Eye },
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

function NewAnamnesisInline({ patientId, onDone, anamnesisId, initialData }: { patientId: string; onDone: () => void; anamnesisId?: string; initialData?: Record<string, string | boolean> }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string | boolean>>(initialData || {});
  const create = useCreateAnamnesis();
  const update = useUpdateAnamnesis();

  const isPending = create.isPending || update.isPending;

  const set = (key: string, val: string | boolean) => setData((prev) => ({ ...prev, [key]: val }));

  const handleSave = async (finalStatus: 'PREENCHIDA' | 'RASCUNHO' = 'PREENCHIDA') => {
    if (anamnesisId) {
      await update.mutateAsync({
        id: anamnesisId,
        patientId,
        status: finalStatus,
        data,
      });
    } else {
      await create.mutateAsync({
        patientId,
        filledAt: new Date().toISOString(),
        status: finalStatus,
        data,
      });
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
            <Field label="Idade">
              <input className="input" type="number" min="0" max="120" placeholder="Ex: 35" value={(data.idade as string) || ''} onChange={(e) => set('idade', e.target.value)} />
            </Field>
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
        <InlineFormHeader title={anamnesisId ? "Editar Ficha de Anamnese" : "Nova Ficha de Anamnese"} onBack={onDone} />

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
                }}>{i < step ? '✓' : <s.icon size={14} />}</div>
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
      dueDate: form.dueDate ? new Date(form.dueDate + 'T12:00:00').toISOString() : undefined,
      totalInstallments: parseInt(form.installments, 10),
      installment: 1,
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

export { NewAnamnesisInline, NewDocumentInline };
