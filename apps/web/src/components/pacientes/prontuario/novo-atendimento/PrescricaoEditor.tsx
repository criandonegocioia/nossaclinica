import { useState } from 'react';
import { Printer, Plus } from 'lucide-react';

const MEDICAMENTOS_PADRAO = [
  { id: '1', nome: 'Amoxicilina 500mg', posologiaPadrao: 'Tomar 1 cápsula a cada 8 horas, por 7 dias.' },
  { id: '2', nome: 'Ibuprofeno 600mg', posologiaPadrao: 'Tomar 1 comprimido a cada 8 horas, em caso de dor.' },
  { id: '3', nome: 'Dipirona 500mg', posologiaPadrao: 'Tomar 1 comprimido a cada 6 horas, em caso de dor ou febre.' },
  { id: '4', nome: 'Nimesulida 100mg', posologiaPadrao: 'Tomar 1 comprimido a cada 12 horas, por 5 dias.' },
  { id: '5', nome: 'Azitromicina 500mg', posologiaPadrao: 'Tomar 1 comprimido ao dia, por 3 dias.' },
  { id: '6', nome: 'Clorexidina 0,12%', posologiaPadrao: 'Bochechar 15ml por 1 minuto, 2x ao dia, por 7 dias.' }
];

interface PrescricaoEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function PrescricaoEditor({ value, onChange }: PrescricaoEditorProps) {
  const [selectedMedId, setSelectedMedId] = useState('');

  const handleInjectMedication = () => {
    if (!selectedMedId) return;
    const med = MEDICAMENTOS_PADRAO.find(m => m.id === selectedMedId);
    if (!med) return;

    const injection = `\n${med.nome}\nPosologia: ${med.posologiaPadrao}\n---`;
    const newValue = value ? `${value}${injection}` : injection.trimStart();
    onChange(newValue);
    setSelectedMedId('');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printDate = new Date().toLocaleDateString('pt-BR');
    const textHtml = value.split('\n').map(line => `<p style="margin: 4px 0;">${line || '&nbsp;'}</p>`).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receituário</title>
        <style>
          @media print { body { margin: 0; } @page { size: A4; margin: 20mm; } }
          body { font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 30px auto; color: #1a1a1a; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 32px; }
          .header h1 { font-size: 24px; color: #0d9488; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
          .header p { font-size: 12px; color: #666; margin: 4px 0 0; }
          .content { font-size: 14px; min-height: 400px; }
          .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #666; }
          .signature { margin: 60px auto 20px; width: 250px; border-top: 1px solid #333; text-align: center; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>OdontoFace Clínica</h1>
          <p>Receituário Odontológico</p>
        </div>
        
        <div class="content">
          <div style="margin-bottom: 24px; font-weight: 600;">Data: ${printDate}</div>
          ${textHtml || '<p style="color: #999; font-style: italic;">Nenhuma prescrição informada.</p>'}
        </div>
        
        <div class="signature">
          Assinatura e Carimbo do Profissional
        </div>
        <div class="footer">
          Este documento é válido por 30 dias a partir da data de emissão.
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <select 
          className="input" 
          style={{ flex: 1, padding: '6px 12px', height: '36px' }}
          value={selectedMedId} 
          onChange={e => setSelectedMedId(e.target.value)}
        >
          <option value="">Selecione um medicamento para injetar...</option>
          {MEDICAMENTOS_PADRAO.map(m => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>
        <button 
          type="button" 
          className="btn btn-secondary btn-sm" 
          onClick={handleInjectMedication}
          disabled={!selectedMedId}
        >
          <Plus size={14} /> Adicionar
        </button>
      </div>
      
      <textarea 
        className="input" 
        rows={4} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        style={{ resize: 'vertical', width: '100%' }} 
        placeholder="Digite a prescrição ou insira medicamentos usando o menu acima..."
      />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handlePrint} style={{ color: 'var(--primary-600)' }}>
          <Printer size={14} /> Gerar PDF da Receita
        </button>
      </div>
    </div>
  );
}
