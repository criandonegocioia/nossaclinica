'use client';

import { useState } from 'react';
import { PatientSelector } from '@/components/shared/PatientSelector';
import {
  Syringe,
  Package,
  MapPin,
  Calendar,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  Info,
} from 'lucide-react';

const FACE_REGIONS = [
  { id: 'testa', label: 'Testa / Frontal', group: 'superior' },
  { id: 'glabela', label: 'Glabela', group: 'superior' },
  { id: 'periorbital', label: 'Periorbital (pés de galinha)', group: 'superior' },
  { id: 'nariz', label: 'Nariz (rinomodelação)', group: 'medio' },
  { id: 'sulco', label: 'Sulco nasogeniano', group: 'medio' },
  { id: 'zigomatico', label: 'Zigomático (maçã do rosto)', group: 'medio' },
  { id: 'labio_sup', label: 'Lábio superior', group: 'labios' },
  { id: 'labio_inf', label: 'Lábio inferior', group: 'labios' },
  { id: 'mentual', label: 'Mento (queixo)', group: 'inferior' },
  { id: 'mandibula', label: 'Mandíbula (jawline)', group: 'inferior' },
  { id: 'papada', label: 'Papada / Submandibular', group: 'inferior' },
  { id: 'temporal', label: 'Região temporal', group: 'lateral' },
  { id: 'masseter', label: 'Masseter', group: 'lateral' },
];

const PRODUCT_TYPES = [
  { value: 'toxina', label: 'Toxina Botulínica' },
  { value: 'ah', label: 'Ácido Hialurônico' },
  { value: 'bioestimulador', label: 'Bioestimulador de Colágeno' },
  { value: 'fio', label: 'Fios de PDO' },
  { value: 'pdrn', label: 'PDRN / Skinbooster' },
  { value: 'enzima', label: 'Enzimas (lipólise)' },
];

const BRANDS: Record<string, string[]> = {
  toxina: ['Botox (Allergan)', 'Dysport (Ipsen)', 'Xeomin (Merz)', 'Botulift', 'Prosigne'],
  ah: ['Juvederm (Allergan)', 'Restylane (Galderma)', 'Rennova (Bergamo)', 'Princess (Croma)', 'Belotero (Merz)'],
  bioestimulador: ['Sculptra (Galderma)', 'Radiesse (Merz)', 'Ellansé', 'Rennova CaHA'],
  fio: ['Ultrasse', 'ProThread', 'NovaThreads', 'Mint'],
  pdrn: ['Volite (Allergan)', 'Profhilo', 'Nucleofill', 'Rejuran'],
  enzima: ['Lipoclin', 'PBSE', 'Enzylift'],
};

interface ProductEntry {
  id: string;
  type: string;
  brand: string;
  lot: string;
  validity: string;
  quantity: string;
  unit: string;
  regions: string[];
  notes: string;
}

export default function HOFPage() {
  const [products, setProducts] = useState<ProductEntry[]>([
    { id: '1', type: '', brand: '', lot: '', validity: '', quantity: '', unit: 'U', regions: [], notes: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const addProduct = () => {
    setProducts((prev) => [
      ...prev,
      { id: Date.now().toString(), type: '', brand: '', lot: '', validity: '', quantity: '', unit: 'U', regions: [], notes: '' },
    ]);
  };

  const removeProduct = (id: string) => {
    if (products.length > 1) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const updateProduct = (id: string, field: keyof ProductEntry, value: string | string[]) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const toggleRegion = (productId: string, region: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const regions = p.regions.includes(region)
          ? p.regions.filter((r) => r !== region)
          : [...p.regions, region];
        return { ...p, regions };
      }),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSaving(false);
    setSaved(true);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Syringe size={28} style={{ color: 'var(--accent-500)' }} />
              Ficha HOF
            </span>
          </h1>
          <p className="page-subtitle">Harmonização Orofacial — Registro de procedimento</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving || saved || !selectedPatientId}>
            {saving ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Salvando...</>
            ) : saved ? (
              <><CheckCircle size={18} /> Salvo!</>
            ) : (
              <><Save size={18} /> Salvar Ficha</>
            )}
          </button>
        </div>
      </div>

      {/* Patient Selector */}
      <PatientSelector
        label="Ficha HOF de"
        selectedPatientId={selectedPatientId ?? undefined}
        onSelect={(p) => setSelectedPatientId(p.id || null)}
      />

      {/* Session Info - without patient (now in PatientSelector) */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Calendar size={16} /> Dados da Sessão
            </span>
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>
            <div className="input-group">
              <label className="input-label required">Data do procedimento</label>
              <input className="input" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="input-group">
              <label className="input-label">Profissional responsável</label>
              <select className="input">
                <option value="">Selecione...</option>
                <option value="1">Dra. Ana Costa</option>
                <option value="2">Dr. João Silva</option>
                <option value="3">Dra. Luísa Santos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      {products.map((product, pIdx) => (
        <div
          key={product.id}
          className="card"
          style={{
            marginBottom: 'var(--space-6)',
            animation: `fadeInUp 0.3s ease backwards ${pIdx * 80}ms`,
            border: '1px solid var(--gray-100)',
          }}
        >
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
              <Package size={16} style={{ color: 'var(--primary-500)' }} />
              Produto {pIdx + 1}
            </h3>
            {products.length > 1 && (
              <button className="btn btn-ghost btn-sm" onClick={() => removeProduct(product.id)} style={{ color: 'var(--error-500)' }}>
                <Trash2 size={16} /> Remover
              </button>
            )}
          </div>
          <div className="card-body">
            {/* Product Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              <div className="input-group">
                <label className="input-label required">Tipo</label>
                <select
                  className="input"
                  value={product.type}
                  onChange={(e) => { updateProduct(product.id, 'type', e.target.value); updateProduct(product.id, 'brand', ''); }}
                >
                  <option value="">Selecione...</option>
                  {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label required">Marca / Produto</label>
                <select
                  className="input"
                  value={product.brand}
                  onChange={(e) => updateProduct(product.id, 'brand', e.target.value)}
                  disabled={!product.type}
                >
                  <option value="">Selecione...</option>
                  {(BRANDS[product.type] || []).map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 'var(--space-2)' }}>
                <div className="input-group">
                  <label className="input-label required">Quantidade</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="Ex: 50"
                    value={product.quantity}
                    onChange={(e) => updateProduct(product.id, 'quantity', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Un.</label>
                  <select className="input" value={product.unit} onChange={(e) => updateProduct(product.id, 'unit', e.target.value)}>
                    <option value="U">U</option>
                    <option value="mL">mL</option>
                    <option value="mg">mg</option>
                    <option value="fios">fios</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              <div className="input-group">
                <label className="input-label required">Lote</label>
                <input
                  className="input"
                  placeholder="Número do lote"
                  value={product.lot}
                  onChange={(e) => updateProduct(product.id, 'lot', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label required">Validade</label>
                <input
                  className="input"
                  type="date"
                  value={product.validity}
                  onChange={(e) => updateProduct(product.id, 'validity', e.target.value)}
                />
              </div>
            </div>

            {/* Regions */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label className="input-label" style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <MapPin size={14} /> Regiões de aplicação
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {FACE_REGIONS.map((region) => {
                  const isSelected = product.regions.includes(region.id);
                  return (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() => toggleRegion(product.id, region.id)}
                      style={{
                        padding: 'var(--space-1-5) var(--space-3)',
                        borderRadius: 'var(--radius-full)',
                        border: `1px solid ${isSelected ? 'var(--primary-400)' : 'var(--gray-200)'}`,
                        background: isSelected ? 'var(--primary-50)' : 'white',
                        color: isSelected ? 'var(--primary-700)' : 'var(--gray-600)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: isSelected ? 'var(--font-semibold)' : 'var(--font-normal)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected && '✓ '}{region.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="input-group">
              <label className="input-label">Observações técnicas</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Técnica utilizada, diluição, agulha/cânula, pontos de injeção..."
                value={product.notes}
                onChange={(e) => updateProduct(product.id, 'notes', e.target.value)}
                style={{ resize: 'vertical', fontSize: 'var(--text-sm)' }}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add Product */}
      <button
        className="btn btn-secondary"
        onClick={addProduct}
        style={{ width: '100%', justifyContent: 'center', marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}
      >
        <Plus size={18} /> Adicionar Produto
      </button>

      {/* Post-procedure */}
      <div className="card" style={{ marginBottom: 'var(--space-10)' }}>
        <div className="card-header">
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Info size={16} /> Orientações Pós-procedimento
            </span>
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>
            <div className="input-group">
              <label className="input-label">Retorno agendado</label>
              <input className="input" type="date" />
            </div>
            <div className="input-group">
              <label className="input-label">Tipo de retorno</label>
              <select className="input">
                <option value="">Selecione...</option>
                <option value="avaliacao">Avaliação de resultado</option>
                <option value="retoque">Retoque</option>
                <option value="nova_sessao">Nova sessão</option>
              </select>
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Cuidados e recomendações</label>
              <textarea
                className="input"
                rows={3}
                defaultValue="• Evitar exposição solar direta por 48h&#10;• Não massagear a região tratada por 24h&#10;• Evitar atividade física intensa por 24h&#10;• Aplicar compressas frias se necessário&#10;• Retornar em caso de dor intensa ou assimetria"
                style={{ resize: 'vertical', fontSize: 'var(--text-sm)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
