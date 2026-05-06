import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useProcedures } from '@/hooks/useApi';

interface ProcedimentosMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function ProcedimentosMultiSelect({ value, onChange }: ProcedimentosMultiSelectProps) {
  const { data: procedures = [], isLoading } = useProcedures({ active: true });
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const selectedProcs = procedures.filter(p => value.includes(p.id));
  const filteredProcs = procedures.filter(p => 
    !value.includes(p.id) && 
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase()))
  );

  const add = (id: string) => {
    onChange([...value, id]);
    setSearch('');
    setOpen(false);
  };

  const remove = (id: string) => {
    onChange(value.filter(v => v !== id));
  };

  return (
    <div style={{ position: 'relative' }}>
      {selectedProcs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          {selectedProcs.map(p => (
            <span key={p.id} className="badge" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
              {p.name}
              <button type="button" onClick={() => remove(p.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--primary-600)', display: 'flex' }}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      
      <div style={{ position: 'relative' }}>
        <input 
          className="input" 
          style={{ width: '100%', paddingRight: '32px' }}
          placeholder={isLoading ? "Carregando..." : "Buscar procedimentos..."}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        <Search size={14} style={{ position: 'absolute', right: 12, top: 12, color: 'var(--gray-400)' }} />
        
        {open && !isLoading && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: '4px', background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', maxHeight: '200px', overflowY: 'auto' }}>
            {filteredProcs.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '13px', color: 'var(--gray-500)', textAlign: 'center' }}>Nenhum procedimento encontrado</div>
            ) : (
              filteredProcs.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => add(p.id)}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--gray-50)', fontSize: '13px' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ fontWeight: 500, color: 'var(--gray-800)' }}>{p.name}</div>
                  {p.code && <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>Cód: {p.code}</div>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
