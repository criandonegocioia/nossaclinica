'use client';

import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { useCreateDocument, useMedications } from '@/hooks/useApi';
import { Field, InlineFormHeader } from '@/components/pacientes/shared/ui';
import BudgetBuilder from './BudgetBuilder';

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

export default function NewDocumentInline({ patientName, patientId, onDone }: { patientName: string; patientId: string; onDone: () => void }) {
  const [docType, setDocType] = useState('TERMO_CONSENTIMENTO');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState(DOC_TEMPLATES.TERMO_CONSENTIMENTO(patientName));
  const [selectedProcs, setSelectedProcs] = useState<string[]>([]);
  const [customProc, setCustomProc] = useState('');
  const { mutate: createDocument } = useCreateDocument();
  const { data: medsData } = useMedications();
  const medications = medsData?.data || [];

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

           const sigRegex = /_{20,}\s*\n\s*(Dr\\(a\\)|OdontoFace|Assinatura)/;
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
    if (type === 'ORCAMENTO') return;
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
    
    if (body.includes('1. ____________________________________________\n   Posologia: __________________________________')) {
       setBody(body.replace('1. ____________________________________________\n   Posologia: __________________________________', `1. ${medBlock}`));
    } else if (body.includes('2. ____________________________________________\n   Posologia: __________________________________')) {
       setBody(body.replace('2. ____________________________________________\n   Posologia: __________________________________', `2. ${medBlock}`));
    } else if (body.includes('3. ____________________________________________\n   Posologia: __________________________________')) {
       setBody(body.replace('3. ____________________________________________\n   Posologia: __________________________________', `3. ${medBlock}`));
    } else {
       const sigRegex = /_{20,}\s*\n\s*(Dr\\(a\\)|OdontoFace|Assinatura)/;
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
