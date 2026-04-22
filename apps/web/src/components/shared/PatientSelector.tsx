'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Search,
  ChevronDown,
  X,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { usePatients } from '@/hooks/useApi';

interface Patient {
  id: string;
  name: string;
  cpf?: string;
  phoneMain?: string;
  status?: string;
}

interface PatientSelectorProps {
  /** Se fornecido, mostra o paciente já selecionado (modo contexto fixo) */
  selectedPatientId?: string;
  /** Callback quando paciente é selecionado */
  onSelect?: (patient: Patient) => void;
  /** Se true, exibe apenas o banner com link para ir ao paciente (sem trocar) */
  readOnly?: boolean;
  /** Rótulo da seção — ex: "Anamnese de" */
  label?: string;
}

/**
 * PatientSelector
 *
 * Usado no topo das telas clínicas (Prontuário, Anamnese, HOF, Fotos)
 * para exibir/selecionar o paciente associado.
 *
 * Quando nenhum paciente está selecionado, mostra um alerta pedindo seleção.
 * Quando selecionado, mostra banner com avatar, nome, CPF e link para o perfil.
 */
export function PatientSelector({
  selectedPatientId,
  onSelect,
  readOnly = false,
  label = 'Paciente',
}: PatientSelectorProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: patientsData, isLoading } = usePatients({ search: query, limit: 8 });
  const patients: Patient[] = patientsData?.data ?? [];

  // Click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsOpen(false);
    setQuery('');
    onSelect?.(patient);
  };

  const handleClear = () => {
    setSelectedPatient(null);
    onSelect?.({ id: '', name: '' });
  };

  // Banner quando paciente está selecionado
  if (selectedPatient || selectedPatientId) {
    const pat = selectedPatient ?? { id: selectedPatientId!, name: 'Carregando...' };
    const initials = pat.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
        padding: 'var(--space-3) var(--space-5)',
        background: 'linear-gradient(135deg, var(--primary-50), var(--teal-50))',
        border: '1px solid var(--primary-200)',
        borderRadius: 'var(--radius-xl)',
        marginBottom: 'var(--space-5)',
        animation: 'fadeInUp 0.2s ease',
      }}>
        <div className="avatar avatar-md" style={{
          background: 'var(--primary-100)', color: 'var(--primary-700)',
          fontSize: '13px', flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: 'var(--font-semibold)', color: 'var(--primary-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
          </div>
          <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-base)', color: 'var(--gray-900)' }}>
            {pat.name}
          </div>
          {pat.cpf && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
              CPF: {pat.cpf} {pat.phoneMain && `· ${pat.phoneMain}`}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.push(`/pacientes/${pat.id}`)}
            title="Abrir perfil completo do paciente"
            style={{ color: 'var(--primary-600)' }}
          >
            <ExternalLink size={14} /> Ver perfil
          </button>
          {!readOnly && (
            <button
              className="btn btn-ghost btn-sm btn-icon"
              onClick={handleClear}
              title="Trocar paciente"
              style={{ color: 'var(--gray-400)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Estado sem paciente selecionado
  return (
    <div style={{ marginBottom: 'var(--space-5)' }}>
      {/* Alerta */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--warning-50)', border: '1px solid var(--warning-200)',
        borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
        borderBottom: 'none',
      }}>
        <AlertCircle size={16} style={{ color: 'var(--warning-500)', flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--warning-700)', fontWeight: 'var(--font-medium)' }}>
          Selecione um paciente para associar este registro
        </span>
      </div>

      {/* Search */}
      <div ref={containerRef} style={{ position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'white', border: '1px solid var(--warning-200)',
          borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
          cursor: 'pointer',
        }} onClick={() => setIsOpen(true)}>
          <User size={16} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
          <input
            className="input"
            placeholder="Buscar paciente pelo nome, CPF ou telefone..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            style={{ border: 'none', padding: 0, flex: 1, fontSize: 'var(--text-sm)' }}
          />
          <Search size={14} style={{ color: 'var(--gray-300)' }} />
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: 'white', borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)', border: '1px solid var(--gray-100)',
            zIndex: 100, animation: 'fadeInUp 0.15s ease',
            maxHeight: 320, overflow: 'auto',
          }}>
            {isLoading ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--gray-400)', fontSize: 'var(--text-sm)' }}>
                Buscando...
              </div>
            ) : patients.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                <User size={24} style={{ margin: '0 auto var(--space-2)', color: 'var(--gray-200)' }} />
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-400)' }}>
                  {query ? `Nenhum paciente para "${query}"` : 'Digite para buscar um paciente'}
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 'var(--space-3)' }}
                  onClick={() => router.push('/pacientes/novo')}
                >
                  + Cadastrar novo paciente
                </button>
              </div>
            ) : (
              <>
                <div style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--gray-400)', borderBottom: '1px solid var(--gray-50)' }}>
                  {patients.length} paciente{patients.length > 1 ? 's' : ''} encontrado{patients.length > 1 ? 's' : ''}
                </div>
                {patients.map((patient) => {
                  const initials = patient.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
                  return (
                    <button
                      key={patient.id}
                      onClick={() => handleSelect(patient)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                        width: '100%', padding: 'var(--space-3) var(--space-4)',
                        background: 'white', border: 'none', cursor: 'pointer',
                        borderBottom: '1px solid var(--gray-50)',
                        transition: 'background 0.1s ease', textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-25)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                    >
                      <div className="avatar avatar-sm" style={{ fontSize: '11px', flexShrink: 0 }}>{initials}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--gray-800)' }}>{patient.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
                          {patient.cpf ?? ''} {patient.phoneMain ? `· ${patient.phoneMain}` : ''}
                        </div>
                      </div>
                      <span className={`badge badge-dot ${patient.status === 'ATIVO' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                        {patient.status ?? 'ATIVO'}
                      </span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
