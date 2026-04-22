'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Filter,
  Users,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { usePatients } from '@/hooks/useApi';

export default function PacientesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ATIVO');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = usePatients({
    page,
    limit,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const patients = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-subtitle">{meta.total} pacientes cadastrados</p>
        </div>
        <div className="page-actions">
          <Link href="/pacientes/novo" className="btn btn-primary">
            <Plus size={18} /> Novo Paciente
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-body" style={{ padding: 'var(--space-3) var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                className="input"
                placeholder="Buscar por nome, CPF ou telefone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ paddingLeft: '42px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Filter size={14} style={{ color: 'var(--gray-400)' }} />
              {['all', 'ATIVO', 'INATIVO'].map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                >
                  {s === 'all' ? 'Todos' : s === 'ATIVO' ? 'Ativos' : 'Inativos'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>E-mail</th>
              <th>Cadastro</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 16, width: j === 0 ? 180 : 100 }} /></td>
                  ))}
                </tr>
              ))
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}>
                  <Users size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.4 }} />
                  <p>Nenhum paciente encontrado</p>
                </td>
              </tr>
            ) : (
              patients.map((patient: any, i: number) => (
                <tr key={patient.id} style={{ animation: `fadeInUp 0.3s ease backwards ${i * 30}ms` }}>
                  <td>
                    <Link
                      href={`/pacientes/${patient.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="avatar">
                        {patient.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--gray-900)' }}>
                          {patient.name}
                        </div>
                        {patient.birthDate && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
                            {new Date(patient.birthDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                    {patient.cpf || '—'}
                  </td>
                  <td>
                    {patient.phoneMain ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} style={{ color: 'var(--gray-400)' }} />
                        {patient.phoneMain}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {patient.email ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)' }}>
                        <Mail size={12} style={{ color: 'var(--gray-400)' }} />
                        {patient.email}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
                    {new Date(patient.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <span className={`badge badge-dot ${patient.status === 'ATIVO' ? 'badge-success' : 'badge-neutral'}`}>
                      {patient.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <Link href={`/pacientes/${patient.id}`} className="btn btn-ghost btn-sm">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--gray-500)',
        }}>
          <span>
            Mostrando {((page - 1) * limit) + 1}–{Math.min(page * limit, meta.total)} de {meta.total}
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              className="btn btn-ghost btn-sm btn-icon"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="btn btn-ghost btn-sm btn-icon"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
