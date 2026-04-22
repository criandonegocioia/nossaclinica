'use client';

import { useState, useRef } from 'react';
import {
  FileText,
  Printer,
  X,
  Download,
  Edit3,
} from 'lucide-react';

interface ReceituarioProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: string;
}

export function ReceituarioModal({ isOpen, onClose, patient }: ReceituarioProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    patient: patient || '',
    date: new Date().toISOString().split('T')[0],
    medicines: [
      { name: '', dosage: '', instructions: '' },
    ],
    notes: '',
  });

  const addMedicine = () => {
    setFormData((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', instructions: '' }],
    }));
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));
  };

  const removeMedicine = (index: number) => {
    if (formData.medicines.length > 1) {
      setFormData((prev) => ({
        ...prev,
        medicines: prev.medicines.filter((_, i) => i !== index),
      }));
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const date = new Date(formData.date).toLocaleDateString('pt-BR');
    const medsHtml = formData.medicines
      .filter((m) => m.name)
      .map((m, i) => `
        <div style="margin-bottom: 20px; padding: 12px 0; border-bottom: 1px dashed #ddd;">
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">${i + 1}. ${m.name}</div>
          ${m.dosage ? `<div style="font-size: 14px; color: #555;">Posologia: ${m.dosage}</div>` : ''}
          ${m.instructions ? `<div style="font-size: 13px; color: #777; margin-top: 4px;">${m.instructions}</div>` : ''}
        </div>
      `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receituário — ${formData.patient}</title>
        <style>
          @media print { body { margin: 0; } @page { size: A5; margin: 15mm; } }
          body { font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 40px auto; color: #1a1a1a; }
          .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { font-size: 22px; color: #0d9488; margin: 0; }
          .header p { font-size: 11px; color: #888; margin: 4px 0 0; }
          .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; color: #555; }
          .patient { font-size: 16px; font-weight: 600; margin-bottom: 20px; padding: 10px; background: #f8fafa; border-radius: 8px; }
          .title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #0d9488; letter-spacing: 1px; margin-bottom: 16px; }
          .notes { margin-top: 20px; padding: 12px; background: #fefce8; border-radius: 8px; font-size: 13px; color: #713f12; }
          .footer { margin-top: 60px; text-align: center; }
          .footer .line { border-top: 1px solid #333; width: 250px; margin: 0 auto 8px; }
          .footer .name { font-size: 14px; font-weight: 600; }
          .footer .cro { font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>OdontoFace Clínica</h1>
          <p>Rua das Clínicas, 123 — Centro — São Paulo/SP — (11) 3456-7890</p>
        </div>
        <div class="info">
          <span>Data: ${date}</span>
          <span>Via: 1ª via paciente</span>
        </div>
        <div class="patient">Paciente: ${formData.patient || '____________________'}</div>
        <div class="title">Receituário</div>
        ${medsHtml}
        ${formData.notes ? `<div class="notes"><strong>Obs:</strong> ${formData.notes}</div>` : ''}
        <div class="footer">
          <div class="line"></div>
          <div class="name">Dr(a). ___________________________</div>
          <div class="cro">CRO-SP 12345</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 600, maxHeight: '85vh', overflow: 'auto', animation: 'fadeInUp 0.3s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
            <Edit3 size={16} style={{ color: 'var(--primary-500)' }} /> Gerar Receituário
          </h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
            <div className="input-group">
              <label className="input-label required">Paciente</label>
              <input
                className="input"
                placeholder="Nome do paciente"
                value={formData.patient}
                onChange={(e) => setFormData((p) => ({ ...p, patient: e.target.value }))}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Data</label>
              <input
                className="input"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label className="input-label" style={{ marginBottom: 'var(--space-3)' }}>Medicamentos</label>
            {formData.medicines.map((med, i) => (
              <div
                key={i}
                style={{
                  padding: 'var(--space-3)', border: '1px solid var(--gray-100)',
                  borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-3)',
                  animation: `fadeInUp 0.2s ease backwards ${i * 50}ms`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', fontWeight: 'var(--font-semibold)' }}>
                    Medicamento {i + 1}
                  </span>
                  {formData.medicines.length > 1 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeMedicine(i)}
                      style={{ color: 'var(--error-400)', padding: '0 4px', height: 20, fontSize: '11px' }}
                    >
                      Remover
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <input
                    className="input"
                    placeholder="Nome (ex: Amoxicilina 500mg)"
                    value={med.name}
                    onChange={(e) => updateMedicine(i, 'name', e.target.value)}
                    style={{ fontSize: 'var(--text-sm)' }}
                  />
                  <input
                    className="input"
                    placeholder="Posologia (ex: 1 cp 8/8h por 7 dias)"
                    value={med.dosage}
                    onChange={(e) => updateMedicine(i, 'dosage', e.target.value)}
                    style={{ fontSize: 'var(--text-sm)' }}
                  />
                </div>
                <input
                  className="input"
                  placeholder="Instruções (ex: Tomar após as refeições)"
                  value={med.instructions}
                  onChange={(e) => updateMedicine(i, 'instructions', e.target.value)}
                  style={{ fontSize: 'var(--text-sm)' }}
                />
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={addMedicine} style={{ color: 'var(--primary-500)' }}>
              + Adicionar medicamento
            </button>
          </div>

          <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="input-label">Observações</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Observações adicionais..."
              value={formData.notes}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              style={{ resize: 'vertical', fontSize: 'var(--text-sm)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={16} /> Imprimir / PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AtestadoProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: string;
}

export function AtestadoModal({ isOpen, onClose, patient }: AtestadoProps) {
  const [formData, setFormData] = useState({
    patient: patient || '',
    date: new Date().toISOString().split('T')[0],
    type: 'comparecimento',
    timeFrom: '',
    timeTo: '',
    days: '1',
    cid: '',
    notes: '',
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const date = new Date(formData.date).toLocaleDateString('pt-BR');
    const typeText = formData.type === 'comparecimento'
      ? `compareceu a esta clínica na data de ${date}${formData.timeFrom ? `, das ${formData.timeFrom} às ${formData.timeTo}` : ''}, para consulta odontológica.`
      : `necessita de afastamento de suas atividades por ${formData.days} dia(s) a partir de ${date}.`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Atestado — ${formData.patient}</title>
        <style>
          @media print { body { margin: 0; } @page { size: A5; margin: 20mm; } }
          body { font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 40px auto; color: #1a1a1a; }
          .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 30px; }
          .header h1 { font-size: 22px; color: #0d9488; margin: 0; }
          .header p { font-size: 11px; color: #888; margin: 4px 0 0; }
          .title { font-size: 18px; font-weight: 700; text-align: center; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 2px; }
          .body { font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 30px; }
          .cid { font-size: 13px; color: #555; margin-top: 16px; }
          .notes { margin-top: 16px; font-size: 13px; color: #555; font-style: italic; }
          .locale { text-align: center; margin: 40px 0 60px; font-size: 14px; }
          .footer { text-align: center; }
          .footer .line { border-top: 1px solid #333; width: 250px; margin: 0 auto 8px; }
          .footer .name { font-size: 14px; font-weight: 600; }
          .footer .cro { font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>OdontoFace Clínica</h1>
          <p>Rua das Clínicas, 123 — Centro — São Paulo/SP — (11) 3456-7890</p>
        </div>
        <div class="title">Atestado ${formData.type === 'comparecimento' ? 'de Comparecimento' : 'Odontológico'}</div>
        <div class="body">
          Atesto, para os devidos fins, que o(a) paciente <strong>${formData.patient || '____________________'}</strong> ${typeText}
          ${formData.cid ? `<div class="cid">CID: ${formData.cid}</div>` : ''}
          ${formData.notes ? `<div class="notes">Obs: ${formData.notes}</div>` : ''}
        </div>
        <div class="locale">São Paulo, ${date}</div>
        <div class="footer">
          <div class="line"></div>
          <div class="name">Dr(a). ___________________________</div>
          <div class="cro">CRO-SP 12345</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 520, maxHeight: '85vh', overflow: 'auto', animation: 'fadeInUp 0.3s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
            <FileText size={16} style={{ color: 'var(--accent-500)' }} /> Gerar Atestado
          </h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label required">Paciente</label>
              <input className="input" value={formData.patient} onChange={(e) => setFormData((p) => ({ ...p, patient: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Tipo</label>
              <select className="input" value={formData.type} onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}>
                <option value="comparecimento">Comparecimento</option>
                <option value="afastamento">Afastamento</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Data</label>
              <input className="input" type="date" value={formData.date} onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))} />
            </div>
          </div>

          {formData.type === 'comparecimento' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div className="input-group"><label className="input-label">Horário entrada</label><input className="input" type="time" value={formData.timeFrom} onChange={(e) => setFormData((p) => ({ ...p, timeFrom: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">Horário saída</label><input className="input" type="time" value={formData.timeTo} onChange={(e) => setFormData((p) => ({ ...p, timeTo: e.target.value }))} /></div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div className="input-group"><label className="input-label">Dias de afastamento</label><input className="input" type="number" min="1" value={formData.days} onChange={(e) => setFormData((p) => ({ ...p, days: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">CID (opcional)</label><input className="input" placeholder="Ex: K02.1" value={formData.cid} onChange={(e) => setFormData((p) => ({ ...p, cid: e.target.value }))} /></div>
            </div>
          )}

          <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="input-label">Observações</label>
            <textarea className="input" rows={2} value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical', fontSize: 'var(--text-sm)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handlePrint}><Printer size={16} /> Imprimir / PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}
