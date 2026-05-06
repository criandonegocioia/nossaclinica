'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ArrowLeft, Save, X } from 'lucide-react';
import { useCreateStockProduct } from '@/hooks/useApi';

const CATEGORIES = [
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

export default function NovoProdutoPage() {
  const router = useRouter();
  const createProduct = useCreateStockProduct();

  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    category: 'TOXINA_BOTULINICA',
    unit: 'frasco',
    minStock: '5',
    supplier: '',
  });

  const handleSave = async () => {
    if (!newProduct.name) return;
    
    await createProduct.mutateAsync({
      ...newProduct,
      minStock: parseInt(newProduct.minStock) || 0,
    });
    
    // Volta para a página de estoque após salvar com sucesso
    router.push('/estoque');
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        
        {/* Page Header padrão (Simulando a tela de Estoque) */}
        <div className="page-header">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Package size={24} style={{ color: 'var(--primary-500)' }} /> Estoque
            </h1>
            <p className="page-subtitle">Gestão de produtos e inventário</p>
          </div>
          <div>
            <button 
              className="btn btn-secondary" 
              onClick={() => router.push('/estoque')}
            >
              <ArrowLeft size={16} /> Voltar para lista
            </button>
          </div>
        </div>

        {/* Formulário num Card em Tela Cheia no Estilo "Inline Expansion" */}
        <div className="card" style={{ animation: 'fadeInDown 0.3s ease' }}>
          
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
              + Novo Produto
            </h3>
            <button 
              className="btn btn-ghost btn-sm btn-icon" 
              onClick={() => router.push('/estoque')}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            
            <div className="input-group">
              <label className="input-label required">Descrição / Nome do produto</label>
              <input 
                className="input" 
                value={newProduct.name} 
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} 
                placeholder="Ex: Botox 100U..." 
                autoFocus
              />
            </div>
            
            <div className="grid grid-2">
              <div className="input-group">
                <label className="input-label required">Marca / Fabricante</label>
                <input 
                  className="input" 
                  value={newProduct.brand} 
                  onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })} 
                  placeholder="Ex: Allergan" 
                />
              </div>
              <div className="input-group">
                <label className="input-label required">Categoria</label>
                <select 
                  className="input" 
                  value={newProduct.category} 
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-2">
              <div className="input-group">
                <label className="input-label required">Unidade de medida</label>
                <select 
                  className="input" 
                  value={newProduct.unit} 
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                >
                  {['frasco', 'seringa', 'unidade', 'caixa', 'carpule', 'ampola', 'kit'].map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Estoque mínimo</label>
                <input 
                  className="input" 
                  type="number" 
                  min="0" 
                  value={newProduct.minStock} 
                  onChange={(e) => setNewProduct({ ...newProduct, minStock: e.target.value })} 
                />
              </div>
            </div>
            
            <div className="input-group">
              <label className="input-label">Fornecedor / Observações</label>
              <input 
                className="input" 
                value={newProduct.supplier} 
                onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })} 
                placeholder="Opcional" 
              />
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => router.push('/estoque')}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                disabled={!newProduct.name || createProduct.isPending} 
                onClick={handleSave}
              >
                {createProduct.isPending ? (
                  <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</>
                ) : (
                  <><Save size={16} /> Salvar Produto</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
