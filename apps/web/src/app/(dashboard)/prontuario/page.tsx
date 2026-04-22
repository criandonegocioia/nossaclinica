'use client';

import { useState } from 'react';
import { PatientSelector } from '@/components/shared/PatientSelector';
import {
  FileText,
  Plus,
  Clock,
  User,
  Lock,
  Save,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Edit3,
} from 'lucide-react';

interface RecordEntry {
  id: string;
  date: string;
  professional: string;
  type: string;
  status: 'DRAFT' | 'FINAL';
  content: string;
  procedures: string[];
}

const MOCK_RECORDS: RecordEntry[] = [
  {
    id: '1',
    date: '2026-04-15T14:30:00',
    professional: 'Dr. João Silva',
    type: 'Consulta de Avaliação',
    status: 'FINAL',
    content: 'Paciente compareceu para avaliação inicial. Queixa principal: dor no dente 36. Exame clínico revelou cárie extensa com comprometimento pulpar. Indicado tratamento endodôntico.',
    procedures: ['Exame clínico', 'Raio-X periapical'],
  },
  {
    id: '2',
    date: '2026-04-10T10:00:00',
    professional: 'Dra. Ana Costa',
    type: 'Harmonização Orofacial',
    status: 'FINAL',
    content: 'Aplicação de toxina botulínica em região frontal e glabelar. Total: 40U Botox. Paciente orientada sobre cuidados pós-procedimento.',
    procedures: ['Toxina botulínica - Frontal', 'Toxina botulínica - Glabela'],
  },
];

const PROCEDURE_OPTIONS = [
  'Exame clínico',
  'Raio-X periapical',
  'Raio-X panorâmico',
  'Profilaxia',
  'Restauração',
  'Endodontia',
  'Extração',
  'Prótese',
  'Ortodontia',
  'Toxina botulínica',
  'Ácido hialurônico',
  'Bioestimulador',
  'Fios de PDO',
  'Limpeza de pele',
  'Peeling',
];

export default function ProntuarioPage() {
  const [records, setRecords] = useState<RecordEntry[]>(MOCK_RECORDS);
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('');
  const [newProcedures, setNewProcedures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const handleSaveRecord = async (status: 'DRAFT' | 'FINAL') => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1500));
    
    if (editingId) {
      setRecords(prev => prev.map(r => r.id === editingId ? {
        ...r,
        type: newType,
        status: status,
        content: newContent,
        procedures: newProcedures,
      } : r));
    } else {
      const newRecord: RecordEntry = {
        id: Math.random().toString(36).substring(7),
        date: new Date().toISOString(),
        professional: 'Profissional Atual',
        type: newType,
        status: status,
        content: newContent,
        procedures: newProcedures,
      };
      setRecords([newRecord, ...records]);
    }

    setSaving(false);
    setShowNewRecord(false);
    setEditingId(null);
    setNewContent('');
    setNewType('');
    setNewProcedures([]);
  };

  const handleCancelNewRecord = () => {
    setShowNewRecord(false);
    setEditingId(null);
    setNewContent('');
    setNewType('');
    setNewProcedures([]);
  };

  const handleEditRecord = (record: RecordEntry) => {
    setEditingId(record.id);
    setNewType(record.type);
    setNewContent(record.content);
    setNewProcedures(record.procedures);
    setShowNewRecord(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleProcedure = (proc: string) => {
    setNewProcedures((prev) =>
      prev.includes(proc) ? prev.filter((p) => p !== proc) : [...prev, proc],
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <FileText size={28} style={{ color: 'var(--primary-500)' }} />
              Prontuário Eletrônico
            </span>
          </h1>
          <p className="page-subtitle">Histórico completo de atendimentos</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => {
            if (showNewRecord) {
               handleCancelNewRecord();
            } else {
               setShowNewRecord(true);
            }
          }} disabled={!selectedPatientId}>
            {showNewRecord ? <><ChevronUp size={18} /> Cancelar</> : <><Plus size={18} /> Novo Registro</>}
          </button>
        </div>
      </div>

      {/* Patient Selector */}
      <PatientSelector
        label="Prontuário de"
        selectedPatientId={selectedPatientId ?? undefined}
        onSelect={(p) => setSelectedPatientId(p.id || null)}
      />

      {/* New Record Form */}
      {showNewRecord && (
        <div className="card" style={{ marginBottom: 'var(--space-6)', animation: 'fadeInUp 0.3s ease', border: '2px solid var(--primary-200)' }}>
          <div className="card-header" style={{ background: 'var(--primary-50)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--primary-700)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Edit3 size={16} /> {editingId ? 'Editando Rascunho' : 'Novo Registro de Atendimento'}
              </span>
            </h3>
            <span className="badge badge-warning">Rascunho</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              <div className="input-group">
                <label className="input-label required">Tipo de atendimento</label>
                <select className="input" value={newType} onChange={(e) => setNewType(e.target.value)}>
                  <option value="">Selecione...</option>
                  <option value="avaliacao">Consulta de Avaliação</option>
                  <option value="tratamento">Tratamento</option>
                  <option value="retorno">Retorno</option>
                  <option value="urgencia">Urgência</option>
                  <option value="hof">Harmonização Orofacial</option>
                  <option value="cirurgia">Cirurgia</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Data e hora</label>
                <input className="input" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
              <label className="input-label">Procedimentos realizados</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {PROCEDURE_OPTIONS.map((proc) => {
                  const selected = newProcedures.includes(proc);
                  return (
                    <button
                      key={proc}
                      type="button"
                      onClick={() => toggleProcedure(proc)}
                      style={{
                        padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-full)',
                        border: `1px solid ${selected ? 'var(--primary-400)' : 'var(--gray-200)'}`,
                        background: selected ? 'var(--primary-50)' : 'white',
                        color: selected ? 'var(--primary-700)' : 'var(--gray-600)',
                        fontSize: 'var(--text-xs)', cursor: 'pointer', transition: 'all 0.15s ease',
                        fontWeight: selected ? 'var(--font-semibold)' : 'var(--font-normal)',
                      }}
                    >
                      {selected && '✓ '}{proc}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
              <label className="input-label required">Evolução / Descrição</label>
              <textarea
                className="input"
                rows={6}
                placeholder="Descreva o atendimento realizado, achados clínicos, conduta e plano de tratamento..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button className="btn btn-secondary" onClick={handleCancelNewRecord}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={() => handleSaveRecord('DRAFT')} disabled={saving || !newContent}>
                {saving ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Salvando...</>
                ) : (
                  <><Save size={16} /> Salvar como Rascunho</>
                )}
              </button>
              <button className="btn btn-primary" onClick={() => handleSaveRecord('FINAL')} style={{ background: 'var(--success-500)' }} disabled={saving || !newContent}>
                <Lock size={16} /> Finalizar (Imutável)
              </button>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <Lock size={12} /> Registros finalizados não podem ser editados. Apenas novas versões podem ser criadas.
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: 'var(--space-8)' }}>
        {/* Timeline line */}
        <div style={{
          position: 'absolute', left: 15, top: 0, bottom: 0,
          width: 2, background: 'var(--gray-100)',
        }} />

        {records.map((record, i) => {
          const isExpanded = expandedId === record.id;
          const date = new Date(record.date);

          return (
            <div
              key={record.id}
              style={{
                position: 'relative', marginBottom: 'var(--space-6)',
                animation: `fadeInUp 0.3s ease backwards ${i * 60}ms`,
              }}
            >
              {/* Timeline dot */}
              <div style={{
                position: 'absolute', left: -25, top: 20,
                width: 12, height: 12, borderRadius: '50%',
                background: record.status === 'FINAL' ? 'var(--success-500)' : 'var(--warning-400)',
                border: '3px solid white', boxShadow: 'var(--shadow-sm)',
              }} />

              <div className="card" style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : record.id)}>
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div>
                      <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--gray-900)' }}>
                        {record.type}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginTop: 2 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={12} /> {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <User size={12} /> {record.professional}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className={`badge badge-dot ${record.status === 'FINAL' ? 'badge-success' : 'badge-warning'}`}>
                      {record.status === 'FINAL' ? 'Finalizado' : 'Rascunho'}
                    </span>
                    {record.status === 'FINAL' && <Lock size={12} style={{ color: 'var(--gray-300)' }} />}
                    {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--gray-400)' }} /> : <ChevronDown size={16} style={{ color: 'var(--gray-400)' }} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="card-body" style={{ animation: 'fadeInUp 0.2s ease', borderTop: '1px solid var(--gray-50)' }}>
                    {record.procedures.length > 0 && (
                      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                        {record.procedures.map((proc) => (
                          <span key={proc} className="badge badge-primary" style={{ fontSize: '11px' }}>
                            {proc}
                          </span>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--gray-700)', whiteSpace: 'pre-wrap' }}>
                      {record.content}
                    </p>
                    {record.status === 'FINAL' && (
                      <p style={{
                        fontSize: 'var(--text-xs)', color: 'var(--gray-300)', marginTop: 'var(--space-4)',
                        display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                      }}>
                        <CheckCircle size={12} /> Registro imutável — assinado digitalmente
                      </p>
                    )}
                    {record.status === 'DRAFT' && (
                      <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-start' }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRecord(record);
                          }}
                        >
                          <Edit3 size={16} /> Continuar Edição
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
