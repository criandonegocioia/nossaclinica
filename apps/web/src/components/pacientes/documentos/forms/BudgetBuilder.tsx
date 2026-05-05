'use client';

import { useState } from 'react';
import { X, FileText, Plus } from 'lucide-react';
import { useCreateDocument } from '@/hooks/useApi';
import { Field, InlineFormHeader } from '@/components/pacientes/shared/ui';
import { ProcedurePrice, INITIAL_PROCEDURE_PRICES, INITIAL_CAMPAIGNS } from '@/components/pacientes/shared/constants';

interface BudgetLine {
  procId: string;
  code: string;
  name: string;
  unitPrice: number;
  discountType: 'NENHUM' | 'PERCENTUAL' | 'FIXO' | 'CAMPANHA';
  discountValue: number;
  campaignId?: string;
}

export default function BudgetBuilder({ patientName, patientId, onDone }: { patientName: string; patientId: string; onDone: () => void }) {
  const [prices, setPrices] = useState(INITIAL_PROCEDURE_PRICES);
  const [campaigns] = useState(INITIAL_CAMPAIGNS);
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [paymentCondition, setPaymentCondition] = useState('PIX');
  const [view, setView] = useState<'budget' | 'prices' | 'campaigns'>('budget');
  const { mutate: createDocument } = useCreateDocument();

  const [newPrice, setNewPrice] = useState({ code: '', name: '', price: '' });

  const activePrices = prices.reduce((map, p) => {
    if (p.status === 'ATIVO') map.set(p.name, p);
    return map;
  }, new Map<string, ProcedurePrice>());

  const activeCampaigns = campaigns.filter((c) => {
    const now = new Date();
    return c.active && new Date(c.startDate) <= now && new Date(c.endDate) >= now;
  });

  const addLine = (proc: ProcedurePrice) => {
    if (lines.some((l) => l.procId === proc.id)) return;
    setLines((prev) => [...prev, {
      procId: proc.id, code: proc.code, name: proc.name,
      unitPrice: proc.price, discountType: 'NENHUM', discountValue: 0,
    }]);
  };

  const removeLine = (procId: string) => setLines((prev) => prev.filter((l) => l.procId !== procId));

  const updateLine = (procId: string, field: string, value: string | number) => {
    setLines((prev) => prev.map((l) => l.procId === procId ? { ...l, [field]: value } : l));
  };

  const applyLineCampaign = (procId: string, campId: string) => {
    const camp = campaigns.find((c) => c.id === campId);
    if (!camp) return;
    setLines((prev) => prev.map((l) =>
      l.procId === procId ? { ...l, discountType: 'CAMPANHA', discountValue: camp.discountValue, campaignId: campId } : l
    ));
  };

  const calcLineDiscount = (line: BudgetLine): number => {
    if (line.discountType === 'PERCENTUAL' || (line.discountType === 'CAMPANHA' && campaigns.find((c) => c.id === line.campaignId)?.discountType === 'PERCENTUAL')) {
      return line.unitPrice * (line.discountValue / 100);
    }
    if (line.discountType === 'FIXO' || (line.discountType === 'CAMPANHA' && campaigns.find((c) => c.id === line.campaignId)?.discountType === 'FIXO')) {
      return line.discountValue;
    }
    return 0;
  };

  const calcLineTotal = (line: BudgetLine): number => Math.max(0, line.unitPrice - calcLineDiscount(line));
  const grandTotal = lines.reduce((sum, l) => sum + calcLineTotal(l), 0);
  const totalDiscount = lines.reduce((sum, l) => sum + calcLineDiscount(l), 0);

  const addNewPrice = () => {
    if (!newPrice.code || !newPrice.name || !newPrice.price) return;
    const updated = prices.map((p) => p.name === newPrice.name && p.status === 'ATIVO' ? { ...p, status: 'INATIVO' as const } : p);
    const entry: ProcedurePrice = {
      id: `pp-${Date.now()}`, code: newPrice.code, name: newPrice.name,
      price: parseFloat(newPrice.price), createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'Administrador', status: 'ATIVO',
    };
    setPrices([...updated, entry]);
    setNewPrice({ code: '', name: '', price: '' });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const textSummary = `Orçamento - OdontoFace Clínica
Paciente: ${patientName}
Data: ${new Date().toLocaleDateString('pt-BR')}

Itens:
${lines.map((l, i) => `${i + 1}. ${l.code} - ${l.name} - Unit: R$ ${l.unitPrice.toLocaleString('pt-BR')} - Total: R$ ${calcLineTotal(l).toLocaleString('pt-BR')}`).join('\n')}

Desconto Total: R$ ${totalDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Total Final: R$ ${grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

Condição de Pagamento: ${paymentCondition}`;

    createDocument({
      type: 'ORCAMENTO',
      patientId: patientId,
      title: 'Orçamento',
      content: { text: textSummary, items: lines, subtotal: grandTotal + totalDiscount, discount: totalDiscount, total: grandTotal, paymentCondition: paymentCondition }
    });

    const tableRows = lines.map((l, i) => {
      const disc = calcLineDiscount(l);
      const total = calcLineTotal(l);
      return `<tr><td>${i + 1}</td><td>${l.code}</td><td>${l.name}</td><td>R$ ${l.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td><td>${disc > 0 ? `- R$ ${disc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</td><td><strong>R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td></tr>`;
    }).join('');
    printWindow.document.write(`<html><head><title>Orçamento - ${patientName}</title>
      <style>body{font-family:'Segoe UI',sans-serif;padding:40px;max-width:780px;margin:0 auto;color:#1a1a1a}
      .header{text-align:center;margin-bottom:20px} .header h2{color:#0d9488;margin:0;font-size:20px} .header p{font-size:12px;color:#888}
      h1{font-size:18px;text-align:center;border-bottom:2px solid #0d9488;padding-bottom:10px}
      table{width:100%;border-collapse:collapse;margin:20px 0} th,td{border:1px solid #e5e7eb;padding:8px 12px;text-align:left;font-size:13px}
      th{background:#f8fafc;font-weight:600;color:#374151} .total-row{background:#f0fdfa;font-weight:600}
      .footer{margin-top:30px;font-size:12px;color:#666} @media print{body{padding:20px}}</style></head><body>
      <div class="header"><h2>OdontoFace Clínica</h2><p>Odontologia & Harmonização Orofacial</p></div>
      <h1>Orçamento</h1>
      <p><strong>Paciente:</strong> ${patientName}<br><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
      <table><thead><tr><th>#</th><th>Código</th><th>Procedimento</th><th>Valor</th><th>Desconto</th><th>Total</th></tr></thead>
      <tbody>${tableRows}
      <tr class="total-row"><td colspan="4"></td><td>Desconto Total</td><td>R$ ${totalDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
      <tr class="total-row"><td colspan="4"></td><td><strong>TOTAL</strong></td><td><strong>R$ ${grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td></tr>
      </tbody></table>
      <p><strong>Condições:</strong> ${paymentCondition}</p>
      <p class="footer">Validade: 30 dias.<br><br>_____________________________<br>OdontoFace Clínica</p>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  if (view === 'prices') {
    return (
      <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
        <div className="card-body">
          <InlineFormHeader title="Tabela de Preços de Procedimentos" onBack={() => setView('budget')} />
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 'var(--space-4)' }}>
            Sempre inserção — o último cadastro com mesmo nome torna-se o preço ativo.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px auto', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
            <input className="input" placeholder="Código" value={newPrice.code} onChange={(e) => setNewPrice({ ...newPrice, code: e.target.value })} style={{ fontSize: 'var(--text-xs)' }} />
            <input className="input" placeholder="Nome do procedimento" value={newPrice.name} onChange={(e) => setNewPrice({ ...newPrice, name: e.target.value })} style={{ fontSize: 'var(--text-xs)' }} />
            <input className="input" type="number" placeholder="Valor" min="0" step="0.01" value={newPrice.price} onChange={(e) => setNewPrice({ ...newPrice, price: e.target.value })} style={{ fontSize: 'var(--text-xs)' }} />
            <button className="btn btn-primary btn-sm" onClick={addNewPrice} disabled={!newPrice.code || !newPrice.name || !newPrice.price}>
              <Plus size={14} /> Inserir
            </button>
          </div>

          <div className="table-container">
            <table className="table" style={{ fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr>
                  <th>Código</th><th>Procedimento</th><th>Valor (R$)</th><th>Criação</th><th>Usuário</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...prices].reverse().map((p) => (
                  <tr key={p.id} style={{ opacity: p.status === 'INATIVO' ? 0.4 : 1 }}>
                    <td style={{ fontFamily: 'monospace' }}>{p.code}</td>
                    <td>{p.name}</td>
                    <td style={{ fontWeight: 600 }}>R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td>{p.createdBy}</td>
                    <td>
                      <span className={`badge ${p.status === 'ATIVO' ? 'badge-success' : 'badge-secondary'}`} style={{ fontSize: '10px' }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'campaigns') {
    return (
      <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
        <div className="card-body">
          <InlineFormHeader title="Campanhas de Desconto" onBack={() => setView('budget')} />
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 'var(--space-4)' }}>
            Gerencie campanhas promocionais para envio via WhatsApp ou E-mail.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {campaigns.map((c) => {
              const isActive = c.active && new Date(c.startDate) <= new Date() && new Date(c.endDate) >= new Date();
              return (
                <div key={c.id} style={{
                  padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${isActive ? 'var(--success-200)' : 'var(--gray-100)'}`,
                  background: isActive ? 'var(--success-25)' : 'white',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{c.name}</div>
                    <span className={`badge ${isActive ? 'badge-success' : 'badge-secondary'}`} style={{ fontSize: '10px' }}>
                      {isActive ? '🟢 Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--gray-600)' }}>
                    <div><strong>Desconto:</strong> {c.discountType === 'PERCENTUAL' ? `${c.discountValue}%` : `R$ ${c.discountValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</div>
                    <div><strong>Início:</strong> {new Date(c.startDate).toLocaleDateString('pt-BR')}</div>
                    <div><strong>Fim:</strong> {new Date(c.endDate).toLocaleDateString('pt-BR')}</div>
                    <div><strong>Canal:</strong> {c.channel === 'WHATSAPP' ? '📱 WhatsApp' : c.channel === 'EMAIL' ? '📧 E-mail' : '📱📧 Ambos'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <InlineFormHeader title="Gerar Orçamento" onBack={onDone} />

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setView('prices')}>
            📋 Tabela de Preços
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setView('campaigns')}>
            🏷️ Campanhas ({activeCampaigns.length} ativa{activeCampaigns.length !== 1 ? 's' : ''})
          </button>
        </div>

        <Field label="Selecione os procedimentos (tabela de preços)" span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-1)' }}>
            {Array.from(activePrices.values()).map((proc) => {
              const selected = lines.some((l) => l.procId === proc.id);
              return (
                <label key={proc.id} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', fontSize: 'var(--text-xs)',
                  background: selected ? 'var(--primary-50)' : 'transparent',
                  color: selected ? 'var(--primary-700)' : 'var(--gray-600)',
                  transition: 'all 0.1s ease',
                }}>
                  <input type="checkbox" checked={selected} onChange={() => selected ? removeLine(proc.id) : addLine(proc)}
                    style={{ width: 14, height: 14, accentColor: 'var(--primary-500)' }} />
                  <span style={{ flex: 1 }}>{proc.name}</span>
                  <span style={{ fontWeight: 600, color: 'var(--success-700)', fontSize: '11px' }}>
                    R$ {proc.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </label>
              );
            })}
          </div>
        </Field>

        {lines.length > 0 && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--gray-500)', marginBottom: 'var(--space-2)', textTransform: 'uppercase' }}>
              Itens do Orçamento
            </div>
            <div className="table-container">
              <table className="table" style={{ fontSize: 'var(--text-xs)' }}>
                <thead>
                  <tr>
                    <th>#</th><th>Código</th><th>Procedimento</th><th>Valor</th><th>Desconto</th><th>Total</th><th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => {
                    const disc = calcLineDiscount(line);
                    const total = calcLineTotal(line);
                    return (
                      <tr key={line.procId}>
                        <td>{i + 1}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{line.code}</td>
                        <td>{line.name}</td>
                        <td>R$ {line.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                            <select className="input" value={line.discountType === 'CAMPANHA' ? `CAMP_${line.campaignId}` : line.discountType} onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'CAMPANHA') return;
                              if (val.startsWith('CAMP_')) {
                                applyLineCampaign(line.procId, val.replace('CAMP_', ''));
                                return;
                              }
                              updateLine(line.procId, 'discountType', val);
                              if (val === 'NENHUM') updateLine(line.procId, 'discountValue', 0);
                            }} style={{ fontSize: '11px', height: 28, minWidth: 90, maxWidth: 160, width: 'auto', padding: '0 4px' }}>
                              <option value="NENHUM">Nenhum</option>
                              <option value="PERCENTUAL">%</option>
                              <option value="FIXO">R$ Fixo</option>
                              {activeCampaigns.length > 0 && <option value="CAMPANHA" disabled>── Campanhas ──</option>}
                              {activeCampaigns.map((c) => (
                                <option key={c.id} value={`CAMP_${c.id}`}>🏷️ {c.name}</option>
                              ))}
                            </select>
                            {(line.discountType === 'PERCENTUAL' || line.discountType === 'FIXO') && (
                              <input className="input" type="number" min="0" step="0.01" value={line.discountValue}
                                onChange={(e) => updateLine(line.procId, 'discountValue', parseFloat(e.target.value) || 0)}
                                style={{ width: 70, fontSize: '11px', height: 28, padding: '0 4px' }} />
                            )}
                            {line.discountType === 'CAMPANHA' && (
                              <span style={{ fontSize: '10px', color: 'var(--success-600)' }}>
                                {campaigns.find((c) => c.id === line.campaignId)?.discountType === 'PERCENTUAL'
                                  ? `${line.discountValue}%` : `R$ ${line.discountValue}`}
                              </span>
                            )}
                            {disc > 0 && <span style={{ fontSize: '10px', color: 'var(--error-500)' }}>-R$ {disc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--success-700)' }}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => removeLine(line.procId)} style={{ color: 'var(--error-500)' }}>
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {totalDiscount > 0 && (
                    <tr style={{ background: 'var(--warning-50)' }}>
                      <td colSpan={4}></td>
                      <td style={{ fontSize: '11px', color: 'var(--error-600)' }}>Desconto Total</td>
                      <td style={{ fontWeight: 600, color: 'var(--error-600)' }}>- R$ {totalDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td></td>
                    </tr>
                  )}
                  <tr style={{ background: 'var(--primary-50)' }}>
                    <td colSpan={4}></td>
                    <td style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>TOTAL</td>
                    <td style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--primary-700)' }}>R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-2" style={{ marginTop: 'var(--space-4)' }}>
          <Field label="Condições de pagamento">
            <select className="input" value={paymentCondition} onChange={(e) => setPaymentCondition(e.target.value)}>
              <option>PIX</option>
              <option>Cartão de Crédito</option>
              <option>Cartão de Débito</option>
              <option>Dinheiro</option>
              <option>Boleto</option>
              <option>PIX + Cartão</option>
              <option>2x no Cartão</option>
              <option>3x no Cartão</option>
              <option>Personalizado</option>
            </select>
          </Field>
          <Field label="Validade">
            <input className="input" value="30 dias" readOnly style={{ background: 'var(--gray-25)' }} />
          </Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
          <button className="btn btn-secondary" onClick={onDone}>Cancelar</button>
          <button className="btn btn-primary" onClick={handlePrint} disabled={lines.length === 0}>
            <FileText size={14} /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
