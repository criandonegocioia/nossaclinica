'use client';

import { useState } from 'react';
import { Plus, FolderOpen, Printer, FileText } from 'lucide-react';
import { useDocuments, useCreateDocument } from '@/hooks/useApi';
import { InlineFormHeader, EmptyState } from '../shared/ui';
import { getApiBaseUrl } from '@/lib/api';
import type { TabComponentProps, Document } from '../shared/types';

// ────────────────────────────────────────────────────────────────────────────
// NOTE: The inline document builder (BudgetBuilder, NewDocumentInline) is
// kept in the main page.tsx for now due to its complexity (900+ lines).
// This component handles only the LIST view. The "Gerar Documento" button
// delegates back to the parent via onShowNew prop.
// ────────────────────────────────────────────────────────────────────────────

interface DocumentosTabProps extends TabComponentProps {
  onShowNew: () => void;
}

export default function DocumentosTab({ patientId, onShowNew }: DocumentosTabProps) {
  const { data: raw } = useDocuments({ patientId });
  const documents: Document[] = (raw as any)?.data ?? raw ?? [];

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Documentos</h3>
        <button className="btn btn-primary btn-sm" onClick={onShowNew}><Plus size={14} /> Gerar Documento</button>
      </div>

      {documents.length === 0 ? (
        <EmptyState icon={FolderOpen} message="Nenhum documento gerado"
          action={<button className="btn btn-primary btn-sm" onClick={onShowNew}><Plus size={14} /> Gerar Documento</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {documents.map((doc, i) => (
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
                  <span className={`badge badge-dot ${doc.status === 'ASSINADO' ? 'badge-success' : 'badge-warning'}`}>
                    {doc.status === 'ASSINADO' ? 'Assinado' : 'Pendente'}
                  </span>
                  {/* PDF link is public — @Public() added to documents.controller.ts */}
                  <a
                    href={`${getApiBaseUrl()}/api/documents/${doc.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm btn-icon"
                    title="Imprimir / Baixar"
                  >
                    <Printer size={16} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
