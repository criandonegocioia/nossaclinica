'use client';

import { useState } from 'react';
import {
  Printer,
  X,
  Plus,
  Trash2,
  DollarSign,
} from 'lucide-react';

interface OrcamentoProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: string;
}

interface ProcedureItem {
  id: string;
  name: string;
  tooth: string;
  qty: number;
  unitPrice: number;
}

const PROCEDURES_CATALOG = [
  { name: 'Consulta de Avaliação', price: 200 },
  { name: 'Profilaxia (Limpeza)', price: 150 },
  { name: 'Restauração Resina Composta', price: 300 },
  { name: 'Restauração Cerâmica (Onlay)', price: 1200 },
  { name: 'Tratamento de Canal (Endodontia)', price: 800 },
  { name: 'Extração Simples', price: 250 },
  { name: 'Extração de Siso', price: 500 },
  { name: 'Coroa de Porcelana', price: 1500 },
  { name: 'Implante Dentário', price: 3500 },
  { name: 'Prótese Removível', price: 1200 },
  { name: 'Clareamento a Laser', price: 800 },
  { name: 'Toxina Botulínica (por região)', price: 600 },
  { name: 'Ácido Hialurônico (por seringa)', price: 1400 },
  { name: 'Bioestimulador Sculptra', price: 1500 },
  { name: 'Fios de PDO (por fio)', price: 200 },
  { name: 'Peeling Químico', price: 350 },
  { name: 'Lente de Contato Dental (por unidade)', price: 2000 },
  { name: 'Placa de Bruxismo', price: 600 },
];

export function OrcamentoModal({ isOpen, onClose, patient }: OrcamentoProps) {
  const [patientName, setPatientName] = useState(patient || '');
  const [validity, setValidity] = useState('30');
  const [discount, setDiscount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('PIX: 5% de desconto\nCartão: até 10x sem juros');
  const [items, setItems] = useState<ProcedureItem[]>([
    { id: '1', name: '', tooth: '', qty: 1, unitPrice: 0 },
  ]);

  const addItem = () => {
    setItems((prev) => [...prev, { id: Date.now().toString(), name: '', tooth: '', qty: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ProcedureItem, value: string | number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const selectProcedure = (id: string, name: string) => {
    const catalog = PROCEDURES_CATALOG.find((p) => p.name === name);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name, unitPrice: catalog?.price || 0 } : i)));
  };

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const discountAmount = discount ? parseFloat(discount) : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const date = new Date().toLocaleDateString('pt-BR');
    const validUntil = new Date(Date.now() + parseInt(validity) * 86400000).toLocaleDateString('pt-BR');

    const rowsHtml = items
      .filter((i) => i.name)
      .map((item, idx) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px;">${idx + 1}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px;">${item.name}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; text-align: center;">${item.tooth || '—'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; text-align: center;">${item.qty}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; text-align: right;">R$ ${item.unitPrice.toLocaleString('pt-BR')}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; text-align: right; font-weight: 600;">R$ ${(item.qty * item.unitPrice).toLocaleString('pt-BR')}</td>
        </tr>
      `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orçamento — ${patientName}</title>
        <style>
          @media print { body { margin: 0; } @page { size: A4; margin: 15mm; } }
          body { font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 30px auto; color: #1a1a1a; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { font-size: 24px; color: #0d9488; margin: 0; }
          .header .info { text-align: right; font-size: 11px; color: #888; }
          .patient { background: #f8fafa; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
          .patient strong { color: #0d9488; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          thead th { background: #f1f5f9; padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: left; letter-spacing: 0.5px; }
          .totals { text-align: right; margin-bottom: 24px; }
          .totals .row { display: flex; justify-content: flex-end; gap: 30px; padding: 4px 12px; font-size: 14px; }
          .totals .total { font-size: 18px; font-weight: 700; color: #0d9488; border-top: 2px solid #0d9488; padding-top: 8px; margin-top: 8px; }
          .payment { background: #fefce8; padding: 12px 16px; border-radius: 8px; margin-bottom: 30px; font-size: 13px; white-space: pre-line; }
          .validity { text-align: center; font-size: 12px; color: #888; margin-bottom: 40px; }
          .footer { display: flex; justify-content: space-between; margin-top: 60px; }
          .sig { text-align: center; }
          .sig .line { border-top: 1px solid #333; width: 200px; margin-bottom: 4px; }
          .sig .name { font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div><h1>OdontoFace Clínica</h1><p style="font-size: 11px; color: #888; margin: 4px 0 0;">Rua das Clínicas, 123 — Centro — São Paulo/SP</p></div>
          <div class="info">ORÇAMENTO<br/>Data: ${date}<br/>Nº ${Math.floor(Math.random() * 9000) + 1000}</div>
        </div>
        <div class="patient"><strong>Paciente:</strong> ${patientName || '____________________'}</div>
        <table>
          <thead><tr><th>#</th><th>Procedimento</th><th style="text-align:center">Dente</th><th style="text-align:center">Qtd</th><th style="text-align:right">Unitário</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="totals">
          <div class="row"><span>Subtotal:</span><span>R$ ${subtotal.toLocaleString('pt-BR')}</span></div>
          ${discountAmount > 0 ? `<div class="row" style="color:#dc2626"><span>Desconto:</span><span>- R$ ${discountAmount.toLocaleString('pt-BR')}</span></div>` : ''}
          <div class="row total"><span>TOTAL:</span><span>R$ ${total.toLocaleString('pt-BR')}</span></div>
        </div>
        ${paymentNotes ? `<div class="payment"><strong>Condições de pagamento:</strong><br/>${paymentNotes}</div>` : ''}
        <div class="validity">Orçamento válido por ${validity} dias — até ${validUntil}</div>
        <div class="footer">
          <div class="sig"><div class="line"></div><div class="name">Paciente</div></div>
          <div class="sig"><div class="line"></div><div class="name">Profissional — CRO-SP 12345</div></div>
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
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}
      onClick={onClose}
    >
      <div className="card" style={{ width: 720, maxHeight: '90vh', overflow: 'auto', animation: 'fadeInUp 0.3s ease' }} onClick={(e) => e.stopPropagation()}>
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
            <DollarSign size={16} style={{ color: 'var(--warning-500)' }} /> Gerar Orçamento
          </h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
            <div className="input-group">
              <label className="input-label required">Paciente</label>
              <input className="input" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Nome do paciente" />
            </div>
            <div className="input-group">
              <label className="input-label">Validade (dias)</label>
              <input className="input" type="number" value={validity} onChange={(e) => setValidity(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Desconto (R$)</label>
              <input className="input" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
            </div>
          </div>

          {/* Items */}
          <label className="input-label" style={{ marginBottom: 'var(--space-3)' }}>Procedimentos</label>
          {items.map((item, i) => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 60px 100px 36px', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'end', animation: `fadeInUp 0.2s ease backwards ${i * 40}ms` }}>
              <div className="input-group" style={{ margin: 0 }}>
                {i === 0 && <label className="input-label" style={{ fontSize: '10px' }}>Procedimento</label>}
                <select className="input" value={item.name} onChange={(e) => selectProcedure(item.id, e.target.value)} style={{ fontSize: 'var(--text-xs)' }}>
                  <option value="">Selecione...</option>
                  {PROCEDURES_CATALOG.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                {i === 0 && <label className="input-label" style={{ fontSize: '10px' }}>Dente</label>}
                <input className="input" placeholder="#" value={item.tooth} onChange={(e) => updateItem(item.id, 'tooth', e.target.value)} style={{ fontSize: 'var(--text-xs)' }} />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                {i === 0 && <label className="input-label" style={{ fontSize: '10px' }}>Qtd</label>}
                <input className="input" type="number" min={1} value={item.qty} onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)} style={{ fontSize: 'var(--text-xs)', textAlign: 'center' }} />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                {i === 0 && <label className="input-label" style={{ fontSize: '10px' }}>Valor un.</label>}
                <input className="input" type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} style={{ fontSize: 'var(--text-xs)' }} />
              </div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => removeItem(item.id)} disabled={items.length <= 1} style={{ color: 'var(--error-400)', height: 36 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={addItem} style={{ color: 'var(--primary-500)', marginBottom: 'var(--space-5)' }}>
            <Plus size={14} /> Adicionar procedimento
          </button>

          {/* Totals */}
          <div style={{ background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--gray-600)', marginBottom: 'var(--space-2)' }}>
              <span>Subtotal:</span><span>R$ {subtotal.toLocaleString('pt-BR')}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--error-500)', marginBottom: 'var(--space-2)' }}>
                <span>Desconto:</span><span>- R$ {discountAmount.toLocaleString('pt-BR')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--success-600)', borderTop: '2px solid var(--success-200)', paddingTop: 'var(--space-2)' }}>
              <span>Total:</span><span>R$ {total.toLocaleString('pt-BR')}</span>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="input-label">Condições de pagamento</label>
            <textarea className="input" rows={2} value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} style={{ resize: 'vertical', fontSize: 'var(--text-sm)' }} />
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
