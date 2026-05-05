'use client';

import { Suspense, lazy, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Edit, FileText, Camera, FolderOpen,
  DollarSign, Stethoscope, Calendar, Phone, Mail,
  MapPin, Clock, Plus, Loader2, X, Save,
} from 'lucide-react';
import { usePatient, useUpdatePatient } from '@/hooks/useApi';
import { calcAge, initials, fmtCpf, fmtDate, Field, TabSkeleton } from '@/components/pacientes/shared/ui';
import { GENDER_LABEL } from '@/components/pacientes/shared/types';

// ── Lazy-loaded tab components ─────────────────────────────────────────────────
const ProntuarioTab  = lazy(() => import('@/components/pacientes/prontuario'));
const FotosTab       = lazy(() => import('@/components/pacientes/fotos'));
const DocumentosTab  = lazy(() => import('@/components/pacientes/documentos'));
const AnamneseTab    = lazy(() => import('@/components/pacientes/anamnese'));
const FinanceiroTab  = lazy(() => import('@/components/pacientes/financeiro'));
const AgendamentosTab = lazy(() => import('@/components/pacientes/agendamentos'));

// ── Heavy inline forms (kept here, not yet split) ─────────────────────────────
// NewAnamnesisInline and NewDocumentInline remain in this file while they
// are still under active refactor. They will be split in a follow-up task.
// See: components/pacientes/anamnese/NewAnamnesisInline.tsx (planned)
//      components/pacientes/documentos/NewDocumentInline.tsx (planned)
import { NewAnamnesisInline, NewDocumentInline } from './_legacy-forms';

const TABS = [
  { id: 'prontuario',   label: 'Prontuário',  icon: FileText },
  { id: 'fotos',        label: 'Fotos',        icon: Camera },
  { id: 'documentos',   label: 'Documentos',   icon: FolderOpen },
  { id: 'anamnese',     label: 'Anamnese',     icon: Stethoscope },
  { id: 'financeiro',   label: 'Financeiro',   icon: DollarSign },
  { id: 'agendamentos', label: 'Agendamentos', icon: Calendar },
] as const;

type TabId = typeof TABS[number]['id'];

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: patient, isLoading, isError } = usePatient(id);

  const [activeTab, setActiveTab] = useState<TabId>('prontuario');
  const [editing, setEditing]     = useState(false);
  // Inline form overrides per tab
  const [showNewAnamnesis, setShowNewAnamnesis]   = useState(false);
  const [editingAnamnese, setEditingAnamnese]     = useState<any>(null);
  const [showNewDocument, setShowNewDocument]     = useState(false);

  // ── Loading / Error states ────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-20)', gap: 'var(--space-4)', color: 'var(--gray-400)' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 'var(--text-sm)' }}>Carregando dados do paciente...</span>
    </div>
  );

  if (isError || !patient) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-20)', gap: 'var(--space-4)' }}>
      <div style={{ fontSize: '48px' }}>😕</div>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)' }}>Paciente não encontrado</h2>
      <Link href="/pacientes" className="btn btn-primary"><ArrowLeft size={16} /> Voltar para Pacientes</Link>
    </div>
  );

  const age    = calcAge(patient.birthDate as string);
  const gender = GENDER_LABEL[patient.gender as string] ?? patient.gender;
  const ini    = initials(patient.name as string);

  // Breadcrumb cache
  if (typeof window !== 'undefined' && patient?.name && id) {
    sessionStorage.setItem(`breadcrumb:${id}`, patient.name as string);
  }

  // ── Tab content dispatcher ────────────────────────────────────────────────
  function renderTab() {
    if (activeTab === 'anamnese' && (showNewAnamnesis || editingAnamnese)) {
      return (
        <NewAnamnesisInline
          patientId={id}
          anamnesisId={editingAnamnese?.id}
          initialData={editingAnamnese?.data || editingAnamnese?.content}
          onDone={() => { setShowNewAnamnesis(false); setEditingAnamnese(null); }}
        />
      );
    }
    if (activeTab === 'documentos' && showNewDocument) {
      return <NewDocumentInline patientName={patient.name as string} patientId={id} onDone={() => setShowNewDocument(false)} />;
    }

    const fallback = <TabSkeleton rows={3} />;
    return (
      <Suspense fallback={fallback}>
        {activeTab === 'prontuario'   && <ProntuarioTab   patientId={id} />}
        {activeTab === 'fotos'        && <FotosTab         patientId={id} />}
        {activeTab === 'documentos'   && <DocumentosTab    patientId={id} onShowNew={() => setShowNewDocument(true)} />}
        {activeTab === 'anamnese'     && <AnamneseTab      patientId={id} onNew={() => setShowNewAnamnesis(true)} onEdit={setEditingAnamnese} />}
        {activeTab === 'financeiro'   && <FinanceiroTab    patientId={id} />}
        {activeTab === 'agendamentos' && <AgendamentosTab  patientId={id} patientName={patient.name as string} />}
      </Suspense>
    );
  }

  return (
    <>
      {/* ── Back link ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link href="/pacientes" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--gray-400)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Voltar para pacientes
        </Link>

        {/* ── Patient header card ──────────────────────────────────────── */}
        <div className="card" style={{ animation: 'fadeInUp 0.35s ease' }}>
          <div className="card-body" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center', flex: 1, minWidth: '280px' }}>
                <div className="avatar avatar-2xl" style={{ fontSize: '20px', fontWeight: 'var(--font-bold)' }}>{ini}</div>
                <div>
                  <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--gray-900)', marginBottom: 'var(--space-1)' }}>{patient.name as string}</h1>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--gray-500)', flexWrap: 'wrap' }}>
                    {age !== null && <span>{age} anos</span>}
                    {patient.gender && patient.gender !== 'NAO_INFORMADO' && <span>• {gender}</span>}
                    {patient.cpf && <span>CPF: {fmtCpf(patient.cpf as string)}</span>}
                    {patient.birthDate && <span>Nasc: {new Date(patient.birthDate as string).toLocaleDateString('pt-BR')}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <span className={`badge badge-dot ${patient.status === 'ATIVO' ? 'badge-success' : 'badge-neutral'}`}>
                      {patient.status === 'ATIVO' ? 'Ativo' : patient.status === 'INATIVO' ? 'Inativo' : 'Arquivado'}
                    </span>
                    {patient.healthInsurance && <span className="badge badge-primary">{patient.healthInsurance as string}</span>}
                    {patient.origin && <span className="badge badge-neutral">{patient.origin as string}</span>}
                  </div>
                </div>
              </div>
              {/* Contact */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
                {patient.phoneMain && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Phone size={14} style={{ color: 'var(--gray-400)' }} /> {patient.phoneMain as string}</div>}
                {patient.email     && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Mail size={14} style={{ color: 'var(--gray-400)' }} /> {patient.email as string}</div>}
                {patient.address   && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><MapPin size={14} style={{ color: 'var(--gray-400)' }} /> {patient.address as string}{patient.city ? `, ${patient.city}` : ''}{patient.state ? `/${patient.state}` : ''}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Clock size={14} style={{ color: 'var(--gray-400)' }} /> Paciente desde {fmtDate(patient.createdAt as string)}</div>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(!editing)}><Edit size={14} /> Editar</button>
                <button className="btn btn-primary btn-sm" onClick={() => { setActiveTab('prontuario'); }}><Plus size={14} /> Novo Atendimento</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setShowNewAnamnesis(false); setEditingAnamnese(null); setShowNewDocument(false); }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Icon size={15} /> {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      {renderTab()}
    </>
  );
}
