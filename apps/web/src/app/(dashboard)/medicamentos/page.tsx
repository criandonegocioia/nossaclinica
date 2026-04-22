'use client';

import { useState } from 'react';
import {
  Pill, Plus, Search, X, Save, CheckCircle, AlertTriangle,
  BookOpen, Info, ChevronLeft,
} from 'lucide-react';
import { useMedications, useCreateMedication } from '@/hooks/useApi';

const MED_CATEGORIES = [
  { value: '', label: 'Todas as categorias' },
  { value: 'ANTIBIOTICO', label: 'Antibiótico' },
  { value: 'ANALGESICO', label: 'Analgésico' },
  { value: 'ANTI_INFLAMATORIO', label: 'Anti-inflamatório' },
  { value: 'ANESTESICO', label: 'Anestésico' },
  { value: 'ANTIFUNGICO', label: 'Antifúngico' },
  { value: 'OUTRO', label: 'Outro' },
];

const CAT_LABELS: Record<string, string> = {
  ANTIBIOTICO: 'Antibiótico', ANALGESICO: 'Analgésico',
  ANTI_INFLAMATORIO: 'Anti-inflamatório', ANESTESICO: 'Anestésico',
  ANTIFUNGICO: 'Antifúngico', OUTRO: 'Outro',
};

const MOCK_MEDS = [
  { id: '1', name: 'Amoxicilina', activeIngredient: 'Amoxicilina tri-hidratada', concentration: '500mg', form: 'COMPRIMIDO', route: 'Oral', defaultDosage: '1 comprimido 8/8h por 7 dias', defaultInstructions: 'Tomar após as refeições', contraindications: 'Alergia a penicilinas, cefalosporinas', interactions: 'Anticoagulantes (aumenta efeito)', category: 'ANTIBIOTICO', active: true },
  { id: '2', name: 'Nimesulida', activeIngredient: 'Nimesulida', concentration: '100mg', form: 'COMPRIMIDO', route: 'Oral', defaultDosage: '1 comprimido 12/12h por 5 dias', defaultInstructions: 'Tomar com alimento', contraindications: 'Insuficiência hepática, gestantes', interactions: 'AAS, anticoagulantes', category: 'ANTI_INFLAMATORIO', active: true },
  { id: '3', name: 'Dipirona Sódica', activeIngredient: 'Dipirona sódica monoidratada', concentration: '500mg', form: 'COMPRIMIDO', route: 'Oral', defaultDosage: '1 comprimido 6/6h se dor', defaultInstructions: 'Pode tomar em jejum', contraindications: 'Alergia à dipirona', interactions: 'Ciclosporina (diminui níveis)', category: 'ANALGESICO', active: true },
  { id: '4', name: 'Lidocaína 2% c/ Epinefrina', activeIngredient: 'Cloridrato de Lidocaína', concentration: '2% + 1:100.000', form: 'INJETAVEL', route: 'Infiltrativo', defaultDosage: '1,8ml por carpule, máx 4 carpules', defaultInstructions: 'Aspirar antes de injetar', contraindications: 'Hipertireoidismo, arritmia cardíaca', interactions: 'Beta-bloqueadores, ADT', category: 'ANESTESICO', active: true },
  { id: '5', name: 'Fluconazol', activeIngredient: 'Fluconazol', concentration: '150mg', form: 'CAPSULA', route: 'Oral', defaultDosage: '1 cápsula dose única', defaultInstructions: 'Pode tomar a qualquer hora', contraindications: 'Uso de terfenaidina, astemizol', interactions: 'Varfarina (aumenta INR)', category: 'ANTIFUNGICO', active: true },
  { id: '6', name: 'Ibuprofeno', activeIngredient: 'Ibuprofeno', concentration: '600mg', form: 'COMPRIMIDO', route: 'Oral', defaultDosage: '1 comprimido 8/8h por 3 dias', defaultInstructions: 'Tomar após refeição com bastante água', contraindications: 'Úlcera péptica, gestantes 3° trimestre', interactions: 'AAS, anticoagulantes, diuréticos', category: 'ANTI_INFLAMATORIO', active: true },
];

const FORM_LABELS: Record<string, string> = {
  COMPRIMIDO: 'Comprimido', CAPSULA: 'Cápsula', LIQUIDO: 'Líquido',
  INJETAVEL: 'Injetável', POMADA: 'Pomada', GEL: 'Gel', SPRAY: 'Spray',
};

export default function MedicamentosPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showDetail, setShowDetail] = useState<any>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: '', activeIngredient: '', concentration: '', form: 'COMPRIMIDO',
    route: 'Oral', defaultDosage: '', defaultInstructions: '', contraindications: '',
    interactions: '', category: 'ANTIBIOTICO',
  });

  const createMed = useCreateMedication();

  const { data, isLoading } = useMedications();
  const meds = data?.data ?? [];

  const filtered = meds.filter((m: any) => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.activeIngredient.toLowerCase().includes(q);
    const matchCat = !category || m.category === category;
    return matchSearch && matchCat;
  });

  if (showDetail) {
    return (
      <>
        <div className="page-header">
          <div className="page-header-content">
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowDetail(null)}>
                <ChevronLeft size={18} />
              </button>
              <BookOpen size={24} style={{ color: 'var(--primary-500)' }} /> {showDetail.name}
            </h1>
            <p className="page-subtitle">Detalhes do medicamento</p>
          </div>
        </div>

        <div className="card" style={{ animation: 'fadeInUp 0.3s ease' }}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span className="badge badge-neutral">{FORM_LABELS[showDetail.form]}</span>
              <span className="badge badge-primary">{CAT_LABELS[showDetail.category]}</span>
              <span className="badge badge-neutral">Via: {showDetail.route}</span>
              <span className="badge badge-neutral">{showDetail.concentration}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              {[
                { label: 'Princípio Ativo', value: showDetail.activeIngredient },
                { label: 'Concentração', value: showDetail.concentration },
                { label: 'Forma Farmacêutica', value: FORM_LABELS[showDetail.form] },
                { label: 'Via de Administração', value: showDetail.route },
              ].map((f) => (
                <div key={f.label} style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--gray-400)', fontWeight: 'var(--font-semibold)', textTransform: 'uppercase', marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--gray-800)' }}>{f.value}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: 'var(--space-4)', background: 'var(--primary-50)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--primary-100)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--primary-600)', marginBottom: 'var(--space-2)', textTransform: 'uppercase' }}>Posologia Padrão</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--primary-900)', marginBottom: 4 }}>{showDetail.defaultDosage}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--primary-700)' }}>{showDetail.defaultInstructions}</div>
            </div>

            {showDetail.contraindications && (
              <div style={{ padding: 'var(--space-4)', background: 'var(--warning-50)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--warning-200)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--warning-600)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase' }}>
                  <AlertTriangle size={12} /> Contraindicações
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--warning-900)' }}>{showDetail.contraindications}</div>
              </div>
            )}

            {showDetail.interactions && (
              <div style={{ padding: 'var(--space-4)', background: 'var(--error-50)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--error-200)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--error-600)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase' }}>
                  <Info size={12} /> Interações Medicamentosas
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--error-900)' }}>{showDetail.interactions}</div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Pill size={24} style={{ color: 'var(--primary-500)' }} /> Medicamentos
          </h1>
          <p className="page-subtitle">Catálogo de medicamentos, posologias padrão e alertas de interação</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={18} /> Novo Medicamento
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Total cadastrados', value: meds.length, color: 'var(--primary-600)' },
          { label: 'Antibióticos', value: meds.filter((m: any) => m.category === 'ANTIBIOTICO').length, color: 'var(--warning-600)' },
          { label: 'Anti-inflamatórios', value: meds.filter((m: any) => m.category === 'ANTI_INFLAMATORIO').length, color: 'var(--error-600)' },
          { label: 'Anestésicos', value: meds.filter((m: any) => m.category === 'ANESTESICO').length, color: 'var(--success-600)' },
        ].map((kpi, i) => (
          <div key={i} className="stat-card" style={{ animation: `fadeInUp 0.3s ease backwards ${i * 60}ms` }}>
            <div className="stat-content">
              <div className="stat-title">{kpi.label}</div>
              <div className="stat-value" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Buscar por nome ou princípio ativo..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input" style={{ width: 220 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          {MED_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
        {filtered.map((med: any, i: number) => (
          <div key={med.id} className="card" style={{ animation: `fadeInUp 0.3s ease backwards ${i * 50}ms`, cursor: 'pointer', transition: 'box-shadow 0.2s ease' }}
            onClick={() => setShowDetail(med)}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = ''}
          >
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div>
                  <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--gray-900)' }}>{med.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{med.activeIngredient} {med.concentration}</div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0 }}>
                  <span className="badge badge-neutral">{FORM_LABELS[med.form] ?? med.form}</span>
                  <span className="badge badge-primary">{CAT_LABELS[med.category] ?? med.category}</span>
                </div>
              </div>

              <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-3)' }}>
                <div style={{ fontSize: '10px', fontWeight: 'var(--font-semibold)', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 2 }}>Posologia padrão</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-700)' }}>{med.defaultDosage}</div>
                <div style={{ fontSize: '10px', color: 'var(--gray-400)', marginTop: 2 }}>{med.defaultInstructions}</div>
              </div>

              {med.contraindications && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--warning-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--warning-100)' }}>
                  <AlertTriangle size={12} style={{ color: 'var(--warning-600)', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: '10px', color: 'var(--warning-800)' }}>
                    <strong>Contraindicações:</strong> {med.contraindications}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}>
              <Pill size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
              <p style={{ fontSize: 'var(--text-sm)' }}>Nenhum medicamento encontrado</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Detalhe ─────────────────────────────── */}
      {/* Moved to fullscreen component above */}

      {/* ── Modal: Novo Medicamento ─────────────────────── */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowNew(false)}>
          <div className="card" style={{ width: 560, maxHeight: '90vh', overflow: 'auto', animation: 'fadeInUp 0.3s ease' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
                <Plus size={18} style={{ color: 'var(--primary-500)' }} /> Novo Medicamento
              </h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="input-group" style={{ gridColumn: '1/-1' }}>
                <label className="input-label required">Nome comercial</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Amoxicilina" />
              </div>
              <div className="input-group">
                <label className="input-label required">Princípio ativo</label>
                <input className="input" value={form.activeIngredient} onChange={(e) => setForm({ ...form, activeIngredient: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Concentração</label>
                <input className="input" value={form.concentration} onChange={(e) => setForm({ ...form, concentration: e.target.value })} placeholder="500mg" />
              </div>
              <div className="input-group">
                <label className="input-label">Forma farmacêutica</label>
                <select className="input" value={form.form} onChange={(e) => setForm({ ...form, form: e.target.value })}>
                  {['COMPRIMIDO', 'CAPSULA', 'LIQUIDO', 'INJETAVEL', 'POMADA', 'GEL', 'SPRAY'].map((f) => <option key={f} value={f}>{FORM_LABELS[f] ?? f}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Categoria</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {MED_CATEGORIES.filter((c) => c.value).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Posologia padrão</label>
                <input className="input" value={form.defaultDosage} onChange={(e) => setForm({ ...form, defaultDosage: e.target.value })} placeholder="Ex: 1 comprimido 8/8h por 7 dias" />
              </div>
              <div className="input-group" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Instruções de uso</label>
                <input className="input" value={form.defaultInstructions} onChange={(e) => setForm({ ...form, defaultInstructions: e.target.value })} placeholder="Tomar após refeições" />
              </div>
              <div className="input-group" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Contraindicações</label>
                <input className="input" value={form.contraindications} onChange={(e) => setForm({ ...form, contraindications: e.target.value })} />
              </div>
              <div className="input-group" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Interações medicamentosas</label>
                <input className="input" value={form.interactions} onChange={(e) => setForm({ ...form, interactions: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancelar</button>
                <button className="btn btn-primary" disabled={!form.name || createMed.isPending} onClick={async () => {
                  await createMed.mutateAsync(form);
                  setShowNew(false);
                }}>
                  {createMed.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : <><CheckCircle size={16} /> Cadastrar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
