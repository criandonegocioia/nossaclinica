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
} from 'lucide-react';
import { useDocuments, usePatients } from '@/hooks/useApi';
import { PatientSelector } from '@/components/shared/PatientSelector';

const DOC_TEMPLATES = [
  { id: 'RECEITUARIO', name: 'Receituário', icon: Receipt, description: 'Prescrição de medicamentos e orientações', color: 'var(--teal-500)' },
  { id: 'ATESTADO', name: 'Atestado', icon: Shield, description: 'Atestado de comparecimento ou afastamento', color: 'var(--accent-500)' },
  { id: 'ORCAMENTO', name: 'Orçamento', icon: Receipt, description: 'Orçamento detalhado de tratamento', color: 'var(--warning-500)' },
  { id: 'TERMO_CONSENTIMENTO', name: 'Termo de Consentimento', icon: FileSignature, description: 'Consentimento para procedimentos clínicos e estéticos', color: 'var(--primary-500)' },
  { id: 'TERMO_HOF', name: 'Termo HOF', icon: FileSignature, description: 'Consentimento específico para harmonização orofacial', color: '#8b5cf6' },
  { id: 'DECLARACAO', name: 'Declaração', icon: FileText, description: 'Declaração para fins diversos', color: '#ec4899' },
];

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

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <FileText size={28} style={{ color: 'var(--accent-500)' }} />
              Documentos
            </span>
          </h1>
          <p className="page-subtitle">{docsList.length} documentos encontrados</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => refetch()} title="Atualizar">
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowTemplates(!showTemplates)}>
            <Plus size={18} /> Gerar Documento
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {showTemplates && (
        <div style={{ marginBottom: 'var(--space-6)', animation: 'fadeInUp 0.3s ease' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--gray-600)', marginBottom: 'var(--space-3)' }}>
            Selecione um modelo:
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
            {DOC_TEMPLATES.map((tpl, i) => {
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.id}
                  className="card"
                  style={{
                    textAlign: 'left', cursor: 'pointer', border: 'none',
                    padding: 'var(--space-4)', transition: 'all 0.2s ease',
                    animation: `fadeInUp 0.3s ease backwards ${i * 50}ms`,
                  }}
                  onClick={() => router.push(`/documentos/novo?type=${tpl.id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 'var(--radius-lg)',
                      background: `${tpl.color}15`, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={18} style={{ color: tpl.color }} />
                    </div>
                    <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--gray-800)' }}>
                      {tpl.name}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', lineHeight: 1.5 }}>
                    {tpl.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card-body" style={{ padding: 'var(--space-3) var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Filter size={14} style={{ color: 'var(--gray-400)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>Paciente:</span>
              <select className="input" value={selectedPatientId || 'all'} onChange={(e) => setSelectedPatientId(e.target.value === 'all' ? null : e.target.value)} style={{ height: 32, fontSize: 'var(--text-xs)', width: 220 }}>
                <option value="all">Todos os pacientes</option>
                {allPatients.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>Tipo:</span>
              <select className="input" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} style={{ height: 32, fontSize: 'var(--text-xs)', width: 180 }}>
                <option value="all">Todos os tipos</option>
                {DOC_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="table-container">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}>
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
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {docsList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}>
                    <FileText size={28} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
                    <p style={{ fontSize: 'var(--text-sm)' }}>Nenhum documento encontrado.</p>
                  </td>
                </tr>
              ) : docsList.map((doc: any, i: number) => {
                const date = new Date(doc.createdAt);
                const tpl = DOC_TEMPLATES.find(t => t.id === doc.type);
                return (
                  <tr key={doc.id} style={{ animation: `fadeInUp 0.2s ease backwards ${i * 30}ms` }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <FileText size={16} style={{ color: tpl?.color || 'var(--primary-400)' }} />
                        <span style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{doc.title || tpl?.name || doc.type}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                        <User size={14} style={{ color: 'var(--gray-400)' }} /> {doc.patient?.name || '—'}
                      </div>
                    </td>
                    <td style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                       {(() => {
                           try {
                               const content = JSON.parse(doc.content);
                               return content.professionalName || 'Profissão Clínica';
                           } catch {
                               return '—';
                           }
                       })()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
                        <Clock size={12} /> {doc.createdAt ? date.toLocaleDateString('pt-BR') : '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/documents/${doc.id}/pdf`} target="_blank" className="btn btn-ghost btn-icon btn-sm" title="Visualizar / Imprimir">
                          <Printer size={14} style={{ color: 'var(--gray-500)' }} />
                        </a>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Visualizar" onClick={() => handleDownloadPdf(doc.id)}><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Download" onClick={() => handleDownloadPdf(doc.id)}><Download size={14} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Imprimir" onClick={() => handleDownloadPdf(doc.id)}><Printer size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {meta && meta.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', padding: 'var(--space-4)', borderTop: '1px solid var(--gray-75)' }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Anterior</button>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', alignSelf: 'center' }}>
              Página {meta.page} de {meta.totalPages}
            </span>
            <button className="btn btn-secondary btn-sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Próxima →</button>
          </div>
        )}
      </div>
    </>
  );
}
