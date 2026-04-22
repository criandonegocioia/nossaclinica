'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { PatientSelector } from '@/components/shared/PatientSelector';
import { useCreateDocument } from '@/hooks/useApi';

export default function NovoDocumentoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'RECEITUARIO';
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [content, setContent] = useState<Record<string, any>>({});
  const { mutateAsync: createDoc, isPending } = useCreateDocument();

  // Receituario specialized states
  const [items, setItems] = useState([{ medication: '', dosage: '', instructions: '' }]);
  const [reason, setReason] = useState('');
  const [days, setDays] = useState(1);

  const handleCreate = async () => {
    if (!selectedPatientId) return alert('Selecione um paciente!');
    
    try {
      const finalContent: any = { ...content };
      if (type === 'RECEITUARIO') finalContent.items = items;
      if (type === 'ATESTADO') { finalContent.reason = reason; finalContent.days = days; }

      await createDoc({
        type,
        patientId: selectedPatientId,
        content: finalContent
      });
      router.push('/documentos');
    } catch (err) {
      console.error(err);
      alert('Erro ao criar documento');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 'var(--space-10)' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Novo Documento</h1>
          <p className="page-subtitle">Preencha os campos para gerar o documento oficial</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreate} disabled={isPending || !selectedPatientId}>
          {isPending ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Save size={18} />} Salvar Documento
        </button>
      </div>

      <PatientSelector
        label="Vincular ao Paciente"
        selectedPatientId={selectedPatientId ?? undefined}
        onSelect={(p) => setSelectedPatientId(p.id || null)}
      />

      <div className="card" style={{ marginTop: 'var(--space-6)' }}>
        <div className="card-header">
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Conteúdo do {type}</h3>
        </div>
        <div className="card-body" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {type === 'RECEITUARIO' && (
            <>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', background: 'var(--gray-50)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                  <div>
                    <label className="label">Medicamento</label>
                    <input className="input" value={item.medication} onChange={e => { const i = [...items]; i[idx].medication = e.target.value; setItems(i); }} />
                  </div>
                  <div>
                    <label className="label">Posologia</label>
                    <input className="input" value={item.dosage} onChange={e => { const i = [...items]; i[idx].dosage = e.target.value; setItems(i); }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="label">Instruções de Uso</label>
                    <textarea className="input" style={{ height: 60 }} value={item.instructions} onChange={e => { const i = [...items]; i[idx].instructions = e.target.value; setItems(i); }} />
                  </div>
                </div>
              ))}
              <div style={{ textAlign: 'center' }}>
                 <button className="btn btn-ghost btn-sm" onClick={() => setItems([...items, { medication: '', dosage: '', instructions: '' }])}>+ Adicionar Medicamento</button>
              </div>
            </>
          )}

          {type === 'ATESTADO' && (
            <>
              <div>
                <label className="label">Dias de Repouso</label>
                <input type="number" className="input" value={days} onChange={e => setDays(Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Motivo (Opcional - CID)</label>
                <input className="input" value={reason} onChange={e => setReason(e.target.value)} />
              </div>
            </>
          )}

          {(!['RECEITUARIO', 'ATESTADO'].includes(type)) && (
            <div>
              <label className="label">Texto Dinâmico do Documento</label>
              <textarea className="input" style={{ height: 200 }} value={content.text || ''} placeholder="Digite o conteúdo do documento..." onChange={e => setContent({ ...content, text: e.target.value })} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
