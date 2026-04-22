'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FileText,
  Stethoscope,
  Sparkles,
  Camera,
  FolderOpen,
  DollarSign,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Activity,
  Package,
  Pill,
  Kanban,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';

const NAV_SECTIONS = [
  {
    title: 'Principal',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'Agenda', href: '/agenda', icon: CalendarDays },
      { label: 'Pacientes', href: '/pacientes', icon: Users },
    ],
  },
  {
    title: 'Clínico',
    items: [
      { label: 'Prontuário', href: '/prontuario', icon: FileText },
      { label: 'Anamnese', href: '/anamnese', icon: Stethoscope },
      { label: 'HOF', href: '/hof', icon: Sparkles },
      { label: 'Fotos', href: '/fotos', icon: Camera },
      { label: 'Documentos', href: '/documentos', icon: FolderOpen },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { label: 'Financeiro',    href: '/financeiro',   icon: DollarSign },
      { label: 'Estoque',       href: '/estoque',      icon: Package },
      { label: 'Medicamentos',  href: '/medicamentos', icon: Pill },
      { label: 'CRM / Funil',   href: '/crm',          icon: Kanban },
      { label: 'Relatórios',    href: '/relatorios',   icon: BarChart3 },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Configurações', href: '/configuracoes', icon: Settings },
      { label: 'Auditoria', href: '/auditoria', icon: ShieldCheck },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Activity size={20} />
        </div>
        <span className="sidebar-logo-text">OdontoFace</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="sidebar-section">
            <div className="sidebar-section-title">{section.title}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar-link-icon">
                    <Icon size={20} />
                  </span>
                  <span className="sidebar-link-text">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Collapse toggle */}
        <button
          className="sidebar-link"
          onClick={() => setCollapsed(!collapsed)}
          style={{ width: '100%', marginBottom: 'var(--space-2)' }}
        >
          <span className="sidebar-link-icon">
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </span>
          <span className="sidebar-link-text">Recolher menu</span>
        </button>

        {/* User info + logout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255,255,255,0.06)',
          }}
        >
          <div className="avatar avatar-sm" style={{ fontSize: '11px' }}>
            {user?.name?.slice(0, 2).toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--white)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name || 'Usuário'}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.45)',
                  textTransform: 'capitalize',
                }}
              >
                {user?.role?.toLowerCase() || 'Perfil'}
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              style={{
                color: 'rgba(255,255,255,0.45)',
                transition: 'color 0.15s',
                padding: '4px',
              }}
              title="Sair"
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-400)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
