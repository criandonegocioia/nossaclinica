'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Package, Pill, X, Plus } from 'lucide-react';
import type { ItemCatalogo, LinhaDespesa } from '@/shared/schemas/itemCatalogoSchema';
import { calcTotalLinha } from '@/shared/schemas/itemCatalogoSchema';
import { useCatalogItems } from '@/hooks/useApi';

interface Props {
  value: LinhaDespesa[];
  onChange: (linhas: LinhaDespesa[]) => void;
}

function ItemRow({ linha, onRemove, onQtdChange }: {
  linha: LinhaDespesa;
  onRemove: () => void;
  onQtdChange: (q: number) => void;
}) {
  const Icon = linha.itemTipo === 'MEDICAMENTO' ? Pill : Package;
  const BRL = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--white)', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
      <Icon size={16} color="var(--gray-400)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-800)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{linha.itemNome}</p>
        <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>{BRL(linha.precoUnitario)} / un</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="number"
          min={1}
          value={linha.quantidade}
          onChange={(e) => onQtdChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="input"
          style={{ width: '64px', textAlign: 'center', padding: '4px', minHeight: '32px' }}
        />
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-700)', width: '80px', textAlign: 'right' }}>
          {BRL(linha.totalLinha)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--error-500)' }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function ItemCatalogoSelect({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: catalogData } = useCatalogItems({ search: query });
  const items: ItemCatalogo[] = catalogData?.data ?? [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addItem = (item: ItemCatalogo) => {
    if (value.some((l) => l.itemId === item.id)) return;
    const nova: LinhaDespesa = {
      itemId: item.id,
      itemNome: item.nome,
      itemTipo: item.tipo,
      quantidade: 1,
      precoUnitario: item.precoUnitario,
      totalLinha: item.precoUnitario,
    };
    onChange([...value, nova]);
    setQuery('');
    setOpen(false);
  };

  const removeItem = (id: string) => onChange(value.filter((l) => l.itemId !== id));

  const updateQtd = (id: string, qtd: number) => {
    onChange(value.map((l) =>
      l.itemId === id
        ? { ...l, quantidade: qtd, totalLinha: calcTotalLinha(qtd, l.precoUnitario) }
        : l,
    ));
  };

  const total = value.reduce((s, l) => s + l.totalLinha, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} ref={containerRef}>
      {/* Search combobox */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--gray-300)', borderRadius: '8px', padding: '0 12px', background: 'var(--white)', height: '44px' }}>
          <Search size={16} color="var(--gray-400)" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar produto ou medicamento..."
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', height: '100%' }}
          />
        </div>
        {open && items.length > 0 && (
          <ul
            style={{ position: 'absolute', zIndex: 20, width: '100%', marginTop: '4px', background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', maxHeight: '224px', overflowY: 'auto', padding: 0, listStyle: 'none' }}
          >
            {items.map((item) => {
              const Icon = item.tipo === 'MEDICAMENTO' ? Pill : Package;
              const selected = value.some((l) => l.itemId === item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={selected}
                    onClick={() => addItem(item)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', textAlign: 'left',
                      background: 'transparent', border: 'none', borderBottom: '1px solid var(--gray-100)', cursor: selected ? 'not-allowed' : 'pointer', opacity: selected ? 0.5 : 1
                    }}
                  >
                    <Icon size={14} color="var(--gray-400)" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-800)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nome}</p>
                      <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>{item.tipo} · {item.unidadeMedida}</p>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-600)', flexShrink: 0 }}>
                      R$ {item.precoUnitario.toFixed(2)}
                    </span>
                    {selected && <span style={{ fontSize: '12px', color: 'var(--success-500)' }}>✓</span>}
                    {!selected && <Plus size={14} color="var(--primary-400)" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Linhas selecionadas */}
      {value.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--gray-50)', borderRadius: '8px', padding: '12px', border: '1px solid var(--gray-200)' }}>
          {value.map((linha) => (
            <ItemRow
              key={linha.itemId}
              linha={linha}
              onRemove={() => removeItem(linha.itemId)}
              onQtdChange={(q) => updateQtd(linha.itemId, q)}
            />
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--gray-200)', marginTop: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-800)' }}>
              Total: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
