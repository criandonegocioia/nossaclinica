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
    <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-100 group">
      <Icon size={14} className="text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{linha.itemNome}</p>
        <p className="text-xs text-gray-400">{BRL(linha.precoUnitario)} / un</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={linha.quantidade}
          onChange={(e) => onQtdChange(Math.max(1, parseInt(e.target.value) || 1))}
          aria-label={`Quantidade de ${linha.itemNome}`}
          className="w-16 text-center text-sm border border-gray-200 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <span className="text-sm font-semibold text-gray-700 w-20 text-right">
          {BRL(linha.totalLinha)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover ${linha.itemNome}`}
          className="p-1 rounded-md hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <X size={12} />
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
    <div className="flex flex-col gap-2" ref={containerRef}>
      {/* Search combobox */}
      <div className="relative">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-200">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar produto ou medicamento..."
            aria-label="Buscar itens do catálogo"
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
          />
        </div>
        {open && items.length > 0 && (
          <ul
            role="listbox"
            aria-label="Itens do catálogo"
            className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-56 overflow-y-auto"
          >
            {items.map((item) => {
              const Icon = item.tipo === 'MEDICAMENTO' ? Pill : Package;
              const selected = value.some((l) => l.itemId === item.id);
              return (
                <li key={item.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    disabled={selected}
                    onClick={() => addItem(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Icon size={14} className="text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.nome}</p>
                      <p className="text-xs text-gray-400">{item.tipo} · {item.unidadeMedida}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-600 shrink-0">
                      R$ {item.precoUnitario.toFixed(2)}
                    </span>
                    {selected && <span className="text-xs text-emerald-500">✓</span>}
                    {!selected && <Plus size={12} className="text-blue-400" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Linhas selecionadas */}
      {value.length > 0 && (
        <div className="flex flex-col gap-1.5 bg-gray-50 rounded-xl p-3">
          {value.map((linha) => (
            <ItemRow
              key={linha.itemId}
              linha={linha}
              onRemove={() => removeItem(linha.itemId)}
              onQtdChange={(q) => updateQtd(linha.itemId, q)}
            />
          ))}
          <div className="flex justify-end pt-2 border-t border-gray-200 mt-1">
            <span className="text-sm font-bold text-gray-800">
              Total: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
