'use client';

import { useState } from 'react';
import {
  Package, Plus, AlertTriangle, TrendingDown, Calendar,
  Search, Filter, ChevronDown, X, Save, BarChart2,
  CheckCircle, ArrowDown, ArrowUp,
} from 'lucide-react';
import { useStockProducts, useStockAlerts, useCreateStockProduct, useCreateStockBatch, useCreateStockMovement } from '@/hooks/useApi';

const CATEGORIES = [
  { value: '', label: 'Todas as categorias' },
  { value: 'TOXINA_BOTULINICA', label: 'Toxina Botulínica' },
  { value: 'ACIDO_HIALURONICO', label: 'Ácido Hialurônico' },
  { value: 'BIOESTIMULADOR', label: 'Bioestimulador' },
  { value: 'FIO_PDO', label: 'Fio de PDO' },
  { value: 'ANESTESICO', label: 'Anestésico' },
  { value: 'MATERIAL_ODONTOLOGICO', label: 'Material Odontológico' },
  { value: 'DESCARTAVEL', label: 'Descartável' },
  { value: 'MEDICAMENTO', label: 'Medicamento' },
  { value: 'OUTRO', label: 'Outro' },
];

const CATEGORY_LABELS: Record<string, string> = {
  TOXINA_BOTULINICA: 'Toxina Botulínica', ACIDO_HIALURONICO: 'Ácido Hialurônico',
  BIOESTIMULADOR: 'Bioestimulador', FIO_PDO: 'Fio de PDO', ANESTESICO: 'Anestésico',
  MATERIAL_ODONTOLOGICO: 'Material Odontológico', DESCARTAVEL: 'Descartável',
  MEDICAMENTO: 'Medicamento', OUTRO: 'Outro',
};

// Mock data while backend Stock module is not yet wired
const MOCK_PRODUCTS = [
  { id: '1', name: 'Botox 100U', brand: 'Allergan', category: 'TOXINA_BOTULINICA', unit: 'frasco', currentStock: 8, minStock: 5, supplier: 'Distribuidora Med', batches: [{ lot: 'LOT24-A1', expiresAt: '2025-01-15', quantity: 3, status: 'EXPIRING' }, { lot: 'LOT24-B2', expiresAt: '2025-06-20', quantity: 5, status: 'ACTIVE' }] },
  { id: '2', name: 'Juvederm Ultra 1ml', brand: 'Allergan', category: 'ACIDO_HIALURONICO', unit: 'seringa', currentStock: 2, minStock: 5, supplier: 'Distribuidora Med', batches: [{ lot: 'LOT24-C3', expiresAt: '2025-08-10', quantity: 2, status: 'ACTIVE' }] },
  { id: '3', name: 'Sculptra 367mg', brand: 'Galderma', category: 'BIOESTIMULADOR', unit: 'frasco', currentStock: 12, minStock: 3, supplier: 'MedSkin', batches: [{ lot: 'LOT24-D4', expiresAt: '2025-12-01', quantity: 12, status: 'ACTIVE' }] },
  { id: '4', name: 'Fio PDO 27G 50mm', brand: 'Mint Lift', category: 'FIO_PDO', unit: 'unidade', currentStock: 0, minStock: 20, supplier: 'AesthMedia', batches: [] },
  { id: '5', name: 'Lidocaína 2% c/ Vasoconstritor', brand: 'DFL', category: 'ANESTESICO', unit: 'carpule', currentStock: 45, minStock: 20, supplier: 'Dental Center', batches: [{ lot: 'LOT24-E5', expiresAt: '2026-03-01', quantity: 45, status: 'ACTIVE' }] },
  { id: '6', name: 'Luvas Nitrílica Azul P', brand: 'Supermax', category: 'DESCARTAVEL', unit: 'caixa', currentStock: 4, minStock: 10, supplier: 'Cirúrgica Cruz', batches: [{ lot: 'LOT24-F6', expiresAt: '2027-01-01', quantity: 4, status: 'ACTIVE' }] },
];

type Stock = typeof MOCK_PRODUCTS[0];

function getStockStatus(p: Stock): 'empty' | 'low' | 'expiring' | 'ok' {
  if (p.currentStock === 0) return 'empty';
  if (p.currentStock < p.minStock) return 'low';
  if (p.batches.some((b) => b.status === 'EXPIRING')) return 'expiring';
  return 'ok';
}

function StockBar({ current, min }: { current: number; min: number }) {
  const pct = min > 0 ? Math.min((current / (min * 2)) * 100, 100) : 100;
  const color = current === 0 ? 'var(--error-500)' : current < min ? 'var(--warning-500)' : 'var(--success-500)';
  return (
    <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden', minWidth: 80 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
    </div>
  );
}

export default function EstoquePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [showNewBatch, setShowNewBatch] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Stock | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [newProduct, setNewProduct] = useState({ name: '', brand: '', category: 'TOXINA_BOTULINICA', unit: 'frasco', minStock: '5', supplier: '' });
  const [newBatch, setNewBatch] = useState({ lot: '', expiresAt: '', quantity: '', unitCost: '' });
  const [movement, setMovement] = useState({ type: 'EXIT', quantity: '', reason: '' });

  const createProduct = useCreateStockProduct();
  const createBatch = useCreateStockBatch();
  const createMovement = useCreateStockMovement();

  // Use mock until backend module is wired
  const products = MOCK_PRODUCTS;

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || p.category === category;
    const status = getStockStatus(p);
    const matchStatus = !statusFilter || statusFilter === status;
    return matchSearch && matchCat && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filtered.length / limit);

  // KPIs
  const total = products.length;
  const expiring = products.filter((p) => p.batches.some((b) => b.status === 'EXPIRING')).length;
  const lowStock = products.filter((p) => p.currentStock < p.minStock).length;
  const empty = products.filter((p) => p.currentStock === 0).length;

  const STATUS_BADGE: Record<string, { label: string; class: string }> = {
    ok: { label: 'OK', class: 'badge-success' },
    low: { label: 'Estoque baixo', class: 'badge-warning' },
    expiring: { label: 'Vencendo', class: 'badge-error' },
    empty: { label: 'Sem estoque', class: 'badge-error' },
  };

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Package size={24} style={{ color: 'var(--primary-500)' }} /> Controle de Estoque
          </h1>
          <p className="page-subtitle">Produtos, lotes e movimentações — rastreabilidade ANVISA</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary" onClick={() => setShowNewBatch(true)}>
            <ArrowDown size={16} /> Entrada
          </button>
          <button className="btn btn-secondary" onClick={() => setShowMovement(true)}>
            <ArrowUp size={16} /> Saída
          </button>
          <button className="btn btn-primary" onClick={() => setShowNewProduct(true)}>
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Total de Produtos', value: total, icon: Package, color: 'var(--primary-600)', bg: 'var(--primary-50)' },
          { label: 'Vencendo em breve', value: expiring, icon: Calendar, color: 'var(--warning-600)', bg: 'var(--warning-50)' },
          { label: 'Estoque baixo', value: lowStock, icon: TrendingDown, color: 'var(--error-600)', bg: 'var(--error-50)' },
          { label: 'Sem estoque', value: empty, icon: AlertTriangle, color: 'var(--error-700)', bg: 'var(--error-50)' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="stat-card" style={{ animation: `fadeInUp 0.3s ease backwards ${i * 60}ms` }}>
              <div className="stat-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <div className="stat-title">{kpi.label}</div>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-lg)', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} style={{ color: kpi.color }} />
                  </div>
                </div>
                <div className="stat-value" style={{ color: kpi.color }}>{kpi.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts banner */}
      {(expiring > 0 || lowStock > 0 || empty > 0) && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--warning-50)', border: '1px solid var(--warning-200)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', animation: 'fadeInUp 0.3s ease' }}>
          <AlertTriangle size={18} style={{ color: 'var(--warning-600)', flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--warning-800)' }}>
            {empty > 0 && <><strong>{empty} produto(s) sem estoque</strong>{(expiring > 0 || lowStock > 0) && ' · '}</>}
            {lowStock > 0 && <><strong>{lowStock} produto(s) abaixo do mínimo</strong>{expiring > 0 && ' · '}</>}
            {expiring > 0 && <><strong>{expiring} lote(s) vencendo nos próximos 30 dias</strong></>}
          </span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Buscar produto ou marca..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input" style={{ width: 220 }} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select className="input" style={{ width: 170 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">Todos os status</option>
          <option value="ok">✅ OK</option>
          <option value="expiring">⚠️ Vencendo</option>
          <option value="low">🟡 Estoque baixo</option>
          <option value="empty">🔴 Sem estoque</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Lotes / Validade</th>
                <th>Estoque Atual</th>
                <th>Nível</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}>
                    <Package size={28} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
                    <p style={{ fontSize: 'var(--text-sm)' }}>Nenhum produto encontrado</p>
                  </td>
                </tr>
              ) : (
                paginated.map((p, i) => {
                  const status = getStockStatus(p);
                  const badge = STATUS_BADGE[status];
                  const nearestExpiry = p.batches.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())[0];
                  return (
                    <tr key={p.id} style={{ animation: `fadeInUp 0.2s ease backwards ${i * 30}ms` }}>
                      <td>
                        <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--gray-900)' }}>{p.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>{p.brand} · {p.supplier}</div>
                      </td>
                      <td><span className="badge badge-neutral">{CATEGORY_LABELS[p.category] ?? p.category}</span></td>
                      <td>
                        {nearestExpiry ? (
                          <div>
                            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>{nearestExpiry.lot}</div>
                            <div style={{ fontSize: '10px', color: nearestExpiry.status === 'EXPIRING' ? 'var(--error-600)' : 'var(--gray-400)' }}>
                              {nearestExpiry.status === 'EXPIRING' && '⚠️ '}Val: {new Date(nearestExpiry.expiresAt).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        ) : <span style={{ color: 'var(--gray-300)', fontSize: 'var(--text-xs)' }}>—</span>}
                      </td>
                      <td>
                        <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-base)', color: status === 'empty' ? 'var(--error-600)' : status === 'low' ? 'var(--warning-600)' : 'var(--gray-800)' }}>
                          {p.currentStock}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--gray-400)', marginLeft: 4 }}>{p.unit}</span>
                        <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>mín: {p.minStock}</div>
                      </td>
                      <td style={{ minWidth: 100 }}>
                        <StockBar current={p.currentStock} min={p.minStock} />
                      </td>
                      <td><span className={`badge badge-dot ${badge.class}`}>{badge.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedProduct(p); setShowNewBatch(true); }} title="Entrada">
                            <ArrowDown size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedProduct(p); setShowMovement(true); }} title="Saída">
                            <ArrowUp size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', padding: 'var(--space-4)', borderTop: '1px solid var(--gray-75)' }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Anterior</button>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', alignSelf: 'center' }}>
              Página {page} de {totalPages}
            </span>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima →</button>
          </div>
        )}
      </div>

      {/* ── Modal: Novo Produto ─────────────────────────── */}
      {showNewProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowNewProduct(false)}>
          <div className="card" style={{ width: 520, animation: 'fadeInUp 0.3s ease' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
                <Package size={18} style={{ color: 'var(--primary-500)' }} /> Novo Produto
              </h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowNewProduct(false)}><X size={18} /></button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="input-group" style={{ gridColumn: '1/-1' }}>
                  <label className="input-label required">Nome do produto</label>
                  <input className="input" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Ex: Botox 100U" />
                </div>
                <div className="input-group">
                  <label className="input-label required">Marca / Fabricante</label>
                  <input className="input" value={newProduct.brand} onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })} placeholder="Ex: Allergan" />
                </div>
                <div className="input-group">
                  <label className="input-label required">Categoria</label>
                  <select className="input" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                    {CATEGORIES.filter((c) => c.value).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label required">Unidade de medida</label>
                  <select className="input" value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}>
                    {['frasco', 'seringa', 'unidade', 'caixa', 'carpule', 'ampola', 'kit'].map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Estoque mínimo</label>
                  <input className="input" type="number" min="0" value={newProduct.minStock} onChange={(e) => setNewProduct({ ...newProduct, minStock: e.target.value })} />
                </div>
                <div className="input-group" style={{ gridColumn: '1/-1' }}>
                  <label className="input-label">Fornecedor</label>
                  <input className="input" value={newProduct.supplier} onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })} placeholder="Ex: Distribuidora MedSkin" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <button className="btn btn-secondary" onClick={() => setShowNewProduct(false)}>Cancelar</button>
                <button className="btn btn-primary" disabled={!newProduct.name || createProduct.isPending} onClick={async () => {
                  await createProduct.mutateAsync({ ...newProduct, minStock: parseInt(newProduct.minStock) });
                  setShowNewProduct(false);
                }}>
                  {createProduct.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : <><Save size={16} /> Cadastrar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Nova Entrada (Lote) ──────────────────── */}
      {showNewBatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowNewBatch(false)}>
          <div className="card" style={{ width: 460, animation: 'fadeInUp 0.3s ease' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--success-700)' }}>
                <ArrowDown size={18} /> Entrada de Estoque
              </h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowNewBatch(false)}><X size={18} /></button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {selectedProduct && (
                <div style={{ padding: 'var(--space-3)', background: 'var(--primary-50)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: 'var(--primary-700)' }}>
                  Produto: <strong>{selectedProduct.name}</strong> — {selectedProduct.brand}
                </div>
              )}
              {!selectedProduct && (
                <div className="input-group">
                  <label className="input-label required">Produto</label>
                  <select className="input" onChange={(e) => setSelectedProduct(products.find((p) => p.id === e.target.value) ?? null)}>
                    <option value="">Selecione...</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.brand}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label className="input-label required">Número do lote</label>
                  <input className="input" value={newBatch.lot} onChange={(e) => setNewBatch({ ...newBatch, lot: e.target.value })} placeholder="LOT2024-A001" />
                </div>
                <div className="input-group">
                  <label className="input-label required">Data de validade</label>
                  <input className="input" type="date" value={newBatch.expiresAt} onChange={(e) => setNewBatch({ ...newBatch, expiresAt: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label required">Quantidade</label>
                  <input className="input" type="number" min="1" value={newBatch.quantity} onChange={(e) => setNewBatch({ ...newBatch, quantity: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Custo unitário (R$)</label>
                  <input className="input" type="number" min="0" step="0.01" value={newBatch.unitCost} onChange={(e) => setNewBatch({ ...newBatch, unitCost: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <button className="btn btn-secondary" onClick={() => { setShowNewBatch(false); setSelectedProduct(null); }}>Cancelar</button>
                <button className="btn btn-primary" disabled={!newBatch.lot || !newBatch.expiresAt || !newBatch.quantity || createBatch.isPending} onClick={async () => {
                  await createBatch.mutateAsync({ productId: selectedProduct?.id, ...newBatch, quantity: parseInt(newBatch.quantity), unitCost: newBatch.unitCost ? parseFloat(newBatch.unitCost) : undefined, expiresAt: new Date(newBatch.expiresAt + 'T12:00:00').toISOString() });
                  setShowNewBatch(false); setSelectedProduct(null);
                }}>
                  {createBatch.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Registrando...</> : <><CheckCircle size={16} /> Registrar Entrada</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Saída / Uso ──────────────────────────── */}
      {showMovement && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowMovement(false)}>
          <div className="card" style={{ width: 420, animation: 'fadeInUp 0.3s ease' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--error-700)' }}>
                <ArrowUp size={18} /> Registrar Saída
              </h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowMovement(false)}><X size={18} /></button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {!selectedProduct && (
                <div className="input-group">
                  <label className="input-label required">Produto</label>
                  <select className="input" onChange={(e) => setSelectedProduct(products.find((p) => p.id === e.target.value) ?? null)}>
                    <option value="">Selecione...</option>
                    {products.filter((p) => p.currentStock > 0).map((p) => <option key={p.id} value={p.id}>{p.name} — Estoque: {p.currentStock} {p.unit}</option>)}
                  </select>
                </div>
              )}
              {selectedProduct && (
                <div style={{ padding: 'var(--space-3)', background: 'var(--error-50)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: 'var(--error-700)' }}>
                  {selectedProduct.name} — Estoque atual: <strong>{selectedProduct.currentStock} {selectedProduct.unit}</strong>
                </div>
              )}
              <div className="input-group">
                <label className="input-label required">Tipo de saída</label>
                <select className="input" value={movement.type} onChange={(e) => setMovement({ ...movement, type: e.target.value })}>
                  <option value="EXIT">Uso em procedimento</option>
                  <option value="ADJUSTMENT">Ajuste de inventário</option>
                  <option value="EXPIRED">Descarte por vencimento</option>
                  <option value="RETURN">Devolução ao fornecedor</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label required">Quantidade</label>
                <input className="input" type="number" min="1" value={movement.quantity} onChange={(e) => setMovement({ ...movement, quantity: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Observação</label>
                <input className="input" value={movement.reason} onChange={(e) => setMovement({ ...movement, reason: e.target.value })} placeholder="Ex: Usado em procedimento Dra. Ana" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <button className="btn btn-secondary" onClick={() => { setShowMovement(false); setSelectedProduct(null); }}>Cancelar</button>
                <button className="btn btn-primary" disabled={!movement.quantity || createMovement.isPending} onClick={async () => {
                  await createMovement.mutateAsync({ productId: selectedProduct?.id, type: movement.type, quantity: parseInt(movement.quantity), reason: movement.reason });
                  setShowMovement(false); setSelectedProduct(null);
                }}>
                  {createMovement.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Registrando...</> : <><Save size={16} /> Registrar Saída</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
