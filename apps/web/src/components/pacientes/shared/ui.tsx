// Shared UI primitives — used across all tab components

import { ChevronLeft } from 'lucide-react';

/** Labeled form field wrapper */
export function Field({
  label,
  children,
  span,
  error,
}: {
  label: string;
  children: React.ReactNode;
  span?: boolean;
  error?: string;
}) {
  return (
    <div className="input-group" style={span ? { gridColumn: 'span 2' } : undefined}>
      <label className="input-label">{label}</label>
      {children}
      {error && <span style={{ color: 'var(--error-600, #dc2626)', fontSize: '11px', marginTop: '4px' }}>{error}</span>}
    </div>
  );
}

/** Back-button + section title */
export function InlineFormHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-5)',
      }}
    >
      <button
        className="btn btn-ghost btn-sm btn-icon"
        onClick={onBack}
        title="Voltar para a lista"
      >
        <ChevronLeft size={18} />
      </button>
      <h3
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--gray-900)',
        }}
      >
        {title}
      </h3>
    </div>
  );
}

/** Generic loading skeleton for a tab */
export function TabSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="card"
          style={{ animation: `fadeIn 0.3s ease backwards ${i * 80}ms` }}
        >
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div
              style={{
                height: 14,
                width: '40%',
                borderRadius: 'var(--radius-md)',
                background: 'var(--gray-100)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: 10,
                width: '80%',
                borderRadius: 'var(--radius-md)',
                background: 'var(--gray-100)',
                animation: 'pulse 1.5s ease-in-out infinite 0.2s',
              }}
            />
            <div
              style={{
                height: 10,
                width: '60%',
                borderRadius: 'var(--radius-md)',
                background: 'var(--gray-100)',
                animation: 'pulse 1.5s ease-in-out infinite 0.4s',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Empty state placeholder */
export function EmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon: React.ElementType;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card">
      <div
        className="card-body"
        style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--gray-400)' }}
      >
        <Icon size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
        <p style={{ fontSize: 'var(--text-sm)' }}>{message}</p>
        {action && <div style={{ marginTop: 'var(--space-4)' }}>{action}</div>}
      </div>
    </div>
  );
}

/** Date mini-calendar block (shared by prontuário + agendamentos) */
export function DateBlock({
  date,
  variant = 'primary',
}: {
  date: Date;
  variant?: 'primary' | 'warning' | 'muted';
}) {
  const bg =
    variant === 'primary'
      ? 'var(--primary-50)'
      : variant === 'warning'
      ? 'var(--warning-50, #fffbeb)'
      : 'var(--gray-50)';
  const textColor =
    variant === 'primary'
      ? 'var(--primary-700)'
      : variant === 'warning'
      ? 'var(--warning-700, #a16207)'
      : 'var(--gray-500)';
  const subColor =
    variant === 'primary'
      ? 'var(--primary-500)'
      : variant === 'warning'
      ? 'var(--warning-500)'
      : 'var(--gray-400)';
  const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  return (
    <div
      style={{
        width: 48,
        minWidth: 48,
        height: 48,
        borderRadius: 'var(--radius-lg)',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: textColor, lineHeight: 1 }}>
        {date.getDate().toString().padStart(2, '0')}
      </div>
      <div style={{ fontSize: 9, color: subColor }}>{MONTHS[date.getMonth()]}</div>
    </div>
  );
}

/** Formats a CPF string as 000.000.000-00 */
export function fmtCpf(cpf: string | null | undefined): string {
  if (!cpf) return '—';
  const clean = String(cpf).replace(/\D/g, '');
  if (clean.length !== 11) return String(cpf);
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
}

export function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}
