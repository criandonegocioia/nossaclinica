'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Download,
  Printer,
  Eye,
  Clock,
  User,
  Filter,
  FileSignature,
  Shield,
  Receipt,
  RefreshCw,
  ChevronRight,
  X,
} from 'lucide-react';
import { useDocuments, usePatients } from '@/hooks/useApi';

// ── Document template definitions ─────────────────────────────────────────────
const DOC_TEMPLATES = [
  {
    id: 'RECEITUARIO',
    name: 'Receituário',
    icon: Receipt,
    description: 'Prescrição de medicamentos e orientações',
    color: '#0d9488',
    bg: '#f0fdfa',
  },
  {
    id: 'ATESTADO',
    name: 'Atestado',
    icon: Shield,
    description: 'Atestado de comparecimento ou afastamento',
    color: '#e11d48',
    bg: '#fff1f2',
  },
  {
    id: 'ORCAMENTO',
    name: 'Orçamento',
    icon: Receipt,
    description: 'Orçamento detalhado de tratamento',
    color: '#d97706',
    bg: '#fffbeb',
  },
  {
    id: 'TERMO_CONSENTIMENTO',
    name: 'Termo de Consentimento',
    icon: FileSignature,
    description: 'Consentimento para procedimentos clínicos e estéticos',
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    id: 'TERMO_HOF',
    name: 'Termo HOF',
    icon: FileSignature,
    description: 'Consentimento específico para harmonização orofacial',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    id: 'DECLARACAO',
    name: 'Declaração',
    icon: FileText,
    description: 'Declaração para fins diversos',
    color: '#db2777',
    bg: '#fdf2f8',
  },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DOC_TEMPLATES.map((t) => [t.id, t.name])
);

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function StatusBadge({ type }: { type: string }) {
  const tpl = DOC_TEMPLATES.find((t) => t.id === type);
  if (!tpl) return <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>{type}</span>;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--font-semibold)',
        background: tpl.bg,
        color: tpl.color,
        border: `1px solid ${tpl.color}30`,
        whiteSpace: 'nowrap',
      }}
    >
      {tpl.name}
    </span>
  );
}

// ── Template selector modal/panel ─────────────────────────────────────────────
function TemplatePanel({ onClose, onSelect }: { onClose: () => void; onSelect: (id: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      style={{
        marginBottom: 'var(--space-5)',
        background: 'var(--gray-25, #fafafa)',
        border: '1px solid var(--gray-100)',
        borderRadius: 'var(--radius-2xl)',
        padding: 'var(--space-5)',
        animation: 'fadeInUp 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--gray-900)', marginBottom: 2 }}>
            Selecione um modelo
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
            Escolha o tipo de documento que deseja gerar
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm btn-icon"
          onClick={onClose}
          title="Fechar"
          style={{ cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
        {DOC_TEMPLATES.map((tpl, i) => {
          const Icon = tpl.icon;
          const isHovered = hovered === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl.id)}
              onMouseEnter={() => setHovered(tpl.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
                padding: 'var(--space-4)',
                background: isHovered ? tpl.bg : 'white',
                border: `1.5px solid ${isHovered ? tpl.color + '60' : 'var(--gray-100)'}`,
                borderRadius: 'var(--radius-xl)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                boxShadow: isHovered ? `0 4px 16px ${tpl.color}20` : '0 1px 3px rgba(0,0,0,0.04)',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                animation: `fadeInUp 0.25s ease backwards ${i * 40}ms`,
                gap: 'var(--space-2)',
              }}
            >
              {/* Icon badge */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-lg)',
                  background: tpl.bg,
                  border: `1px solid ${tpl.color}25`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-1)',
                  flexShrink: 0,
                }}
              >
                <Icon size={20} style={{ color: tpl.color }} />
              </div>

              <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--gray-800)', lineHeight: 1.3 }}>
                {tpl.name}
              </span>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', lineHeight: 1.5, margin: 0 }}>
                {tpl.description}
              </p>

              {/* CTA arrow */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4, marginTop: 'auto',
                fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)',
                color: isHovered ? tpl.color : 'var(--gray-300)',
                transition: 'color 0.18s ease',
              }}>
                Gerar <ChevronRight size={12} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <tr>
      <td colSpan={6}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-16) var(--space-8)',
            gap: 'var(--space-3)',
          }}
        >
          {/* Illustration */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 'var(--radius-2xl)',
              background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdfa 100%)',
              border: '1.5px solid var(--gray-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-2)',
            }}
          >
            <FileText size={32} style={{ color: '#94a3b8' }} />
          </div>

          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--gray-700)', margin: 0 }}>
            Nenhum documento ainda
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-400)', textAlign: 'center', maxWidth: 320, margin: 0 }}>
            Gere receituários, atestados, termos de consentimento e muito mais com um clique.
          </p>

          <button
            className="btn btn-primary"
            onClick={onGenerate}
            style={{ marginTop: 'var(--space-2)', cursor: 'pointer' }}
          >
            <Plus size={16} /> Gerar primeiro documento
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DocumentosPage() {
  const router = useRouter();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showTemplates, setShowTemplates] = useState(false);
  const [page, setPage] = useState(1);

  const { data: documents, isLoading, refetch } = useDocuments({
    patientId: selectedPatientId || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    page,
    limit: 10,
  });

  const { data: patientsData } = usePatients({ limit: 100 });
  const allPatients = patientsData?.data || [];

  const docsList = documents?.data || [];
  const meta = documents?.meta;

  const handleDownloadPdf = (id: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/documents/${id}/pdf`, '_blank');
  };

  const handleSelectTemplate = (id: string) => {
    router.push(`/documentos/novo?type=${id}`);
  };

  // Resolves professional name from JSON content
  const getProfessional = (content: string) => {
    try {
      return JSON.parse(content)?.professionalName || '—';
    } catch {
      return '—';
    }
  };

  return (
    <>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <FileText size={26} style={{ color: '#2563eb' }} />
              Documentos
            </span>
          </h1>
          <p className="page-subtitle" style={{ minHeight: 20 }}>
            {isLoading
              ? 'Carregando...'
              : `${meta?.total ?? docsList.length} documento${(meta?.total ?? docsList.length) !== 1 ? 's' : ''} encontrado${(meta?.total ?? docsList.length) !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => refetch()}
            title="Atualizar lista"
            style={{ cursor: 'pointer' }}
          >
            <RefreshCw size={14} />
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowTemplates((v) => !v)}
            style={{ cursor: 'pointer', gap: 'var(--space-2)' }}
          >
            {showTemplates ? <X size={16} /> : <Plus size={16} />}
            {showTemplates ? 'Fechar' : 'Gerar Documento'}
          </button>
        </div>
      </div>

      {/* ── Template selector panel ──────────────────────────────────────── */}
      {showTemplates && (
        <TemplatePanel
          onClose={() => setShowTemplates(false)}
          onSelect={handleSelectTemplate}
        />
      )}

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div
        className="card"
        style={{ marginBottom: 'var(--space-4)' }}
      >
        <div
          className="card-body"
          style={{
            padding: 'var(--space-3) var(--space-5)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
          }}
        >
          <Filter size={14} style={{ color: 'var(--gray-300)', flexShrink: 0 }} />

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
              Paciente:
            </span>
            <select
              className="input"
              value={selectedPatientId || 'all'}
              onChange={(e) => { setSelectedPatientId(e.target.value === 'all' ? null : e.target.value); setPage(1); }}
              style={{ height: 32, fontSize: 'var(--text-xs)', minWidth: 200, cursor: 'pointer' }}
            >
              <option value="all">Todos os pacientes</option>
              {allPatients.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
              Tipo:
            </span>
            <select
              className="input"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              style={{ height: 32, fontSize: 'var(--text-xs)', minWidth: 160, cursor: 'pointer' }}
            >
              <option value="all">Todos os tipos</option>
              {DOC_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>

          {/* Active filter chips */}
          {(selectedPatientId || typeFilter !== 'all') && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSelectedPatientId(null); setTypeFilter('all'); setPage(1); }}
              style={{ cursor: 'pointer', color: 'var(--gray-400)', fontSize: 'var(--text-xs)' }}
            >
              <X size={12} /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Documents table ───────────────────────────────────────────────── */}
      <div className="table-container">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--gray-400)' }}>
            <div className="spinner spinner-lg" style={{ margin: '0 auto var(--space-4)' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>Buscando documentos...</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Paciente</th>
                <th>Profissional</th>
                <th>Data</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {docsList.length === 0 ? (
                <EmptyState onGenerate={() => setShowTemplates(true)} />
              ) : (
                docsList.map((doc: any, i: number) => {
                  const tpl = DOC_TEMPLATES.find((t) => t.id === doc.type);
                  return (
                    <tr
                      key={doc.id}
                      style={{ animation: `fadeInUp 0.2s ease backwards ${i * 30}ms` }}
                    >
                      {/* Document name */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 'var(--radius-md)',
                              background: tpl?.bg || '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <FileText size={14} style={{ color: tpl?.color || '#64748b' }} />
                          </div>
                          <span style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', color: 'var(--gray-800)' }}>
                            {doc.title || tpl?.name || doc.type}
                          </span>
                        </div>
                      </td>

                      {/* Patient */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
                          <User size={13} style={{ color: 'var(--gray-300)', flexShrink: 0 }} />
                          {doc.patient?.name || '—'}
                        </div>
                      </td>

                      {/* Professional */}
                      <td style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                        {getProfessional(doc.content)}
                      </td>

                      {/* Date */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
                          <Clock size={11} />
                          {doc.createdAt ? fmtDate(doc.createdAt) : '—'}
                        </div>
                      </td>

                      {/* Type badge */}
                      <td>
                        <StatusBadge type={doc.type} />
                      </td>

                      {/* Actions — consolidated, right-aligned */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            title="Visualizar"
                            onClick={() => handleDownloadPdf(doc.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            title="Baixar PDF"
                            onClick={() => handleDownloadPdf(doc.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <Download size={14} />
                          </button>
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/documents/${doc.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Imprimir"
                            style={{ cursor: 'pointer' }}
                          >
                            <Printer size={14} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              borderTop: '1px solid var(--gray-75)',
            }}
          >
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              style={{ cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
            >
              ← Anterior
            </button>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
              Página <strong style={{ color: 'var(--gray-700)' }}>{meta.page}</strong> de {meta.totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{ cursor: page >= meta.totalPages ? 'not-allowed' : 'pointer' }}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
