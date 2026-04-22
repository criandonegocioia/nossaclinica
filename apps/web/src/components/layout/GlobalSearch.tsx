'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  User,
  Calendar,
  FileText,
  Clock,
  ArrowRight,
  X,
  Sparkles,
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'patient' | 'appointment' | 'document';
  title: string;
  subtitle: string;
  href: string;
}

const MOCK_RESULTS: SearchResult[] = [
  { id: '1', type: 'patient', title: 'Maria Silva Oliveira', subtitle: 'CPF: 123.456.789-00 · (11) 99999-1234', href: '/pacientes/1' },
  { id: '2', type: 'patient', title: 'João Santos', subtitle: 'CPF: 987.654.321-00 · (11) 98888-5678', href: '/pacientes/2' },
  { id: '3', type: 'patient', title: 'Ana Costa Lima', subtitle: 'CPF: 456.789.123-00 · (11) 97777-4321', href: '/pacientes/3' },
  { id: '4', type: 'patient', title: 'Carlos Eduardo Lima', subtitle: 'CPF: 789.123.456-00 · (11) 96666-8765', href: '/pacientes/4' },
  { id: '5', type: 'patient', title: 'Fernanda Oliveira', subtitle: 'CPF: 321.654.987-00 · (11) 95555-1234', href: '/pacientes/5' },
  { id: '6', type: 'appointment', title: 'Toxina Botulínica — Maria Silva', subtitle: 'Hoje 10:00 · Sala HOF · Dra. Ana', href: '/agenda' },
  { id: '7', type: 'appointment', title: 'Restauração #36 — João Santos', subtitle: 'Hoje 08:30 · Sala 1 · Dr. João', href: '/agenda' },
  { id: '8', type: 'document', title: 'Termo HOF — Fernanda Oliveira', subtitle: '14/04/2026 · Assinado', href: '/documentos' },
];

const TYPE_CONFIG = {
  patient: { icon: User, label: 'Paciente', color: 'var(--primary-500)' },
  appointment: { icon: Calendar, label: 'Agendamento', color: 'var(--teal-500)' },
  document: { icon: FileText, label: 'Documento', color: 'var(--accent-500)' },
};

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.length >= 2
    ? MOCK_RESULTS.filter((r) =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.subtitle.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      router.push(results[selectedIndex].href);
      setIsOpen(false);
      setQuery('');
    }
  }, [results, selectedIndex, router]);

  const navigate = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1 }}>
      <div className="topbar-search">
        <Search size={16} className="topbar-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="topbar-search-input"
          placeholder="Buscar paciente, CPF ou telefone... (Ctrl+K)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setSelectedIndex(0); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          id="global-search"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setIsOpen(false); }}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--gray-400)', padding: 4,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)', border: '1px solid var(--gray-100)',
          zIndex: 1000, animation: 'fadeInUp 0.15s ease',
          maxHeight: 400, overflow: 'auto',
        }}>
          {results.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--gray-400)' }}>
              <Search size={24} style={{ margin: '0 auto var(--space-2)', opacity: 0.3 }} />
              <p style={{ fontSize: 'var(--text-sm)' }}>Nenhum resultado para &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <>
              <div style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
                {results.length} resultado{results.length > 1 ? 's' : ''}
              </div>
              {results.map((result, i) => {
                const cfg = TYPE_CONFIG[result.type];
                const Icon = cfg.icon;
                const isSelected = i === selectedIndex;
                return (
                  <button
                    key={result.id}
                    onClick={() => navigate(result.href)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                      width: '100%', padding: 'var(--space-3) var(--space-4)',
                      background: isSelected ? 'var(--gray-50)' : 'white',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.1s ease',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 'var(--radius-lg)', flexShrink: 0,
                      background: `${cfg.color}12`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={16} style={{ color: cfg.color }} />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {result.title}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {result.subtitle}
                      </div>
                    </div>
                    <span style={{ fontSize: '9px', color: cfg.color, background: `${cfg.color}12`, padding: '2px 6px', borderRadius: 'var(--radius-full)', flexShrink: 0, textTransform: 'uppercase', fontWeight: 'var(--font-semibold)', letterSpacing: '0.5px' }}>
                      {cfg.label}
                    </span>
                    {isSelected && <ArrowRight size={14} style={{ color: 'var(--gray-300)', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
