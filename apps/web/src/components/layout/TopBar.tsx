'use client';

import { ChevronRight } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { NotificationsDropdown } from './NotificationsDropdown';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/agenda': 'Agenda',
  '/pacientes': 'Pacientes',
  '/prontuario': 'Prontuário',
  '/anamnese': 'Anamnese',
  '/hof': 'Harmonização Orofacial',
  '/fotos': 'Fotos Clínicas',
  '/documentos': 'Documentos',
  '/financeiro': 'Financeiro',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
  '/auditoria': 'Auditoria',
};

export function TopBar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  // Build breadcrumb from pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((_, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    return { path, label: ROUTE_LABELS[path] || segments[index] };
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Breadcrumb */}
        <nav className="topbar-breadcrumb">
          <a href="/">Início</a>
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ChevronRight size={14} />
              {i === breadcrumbs.length - 1 ? (
                <span className="topbar-breadcrumb-current">{crumb.label}</span>
              ) : (
                <a href={crumb.path}>{crumb.label}</a>
              )}
            </span>
          ))}
          {breadcrumbs.length === 0 && (
            <>
              <ChevronRight size={14} />
              <span className="topbar-breadcrumb-current">Dashboard</span>
            </>
          )}
        </nav>

        {/* Search */}
        <GlobalSearch />
      </div>

      <div className="topbar-right">
        {/* Notifications */}
        <NotificationsDropdown />

        {/* User */}
        <div className="topbar-user" id="user-menu">
          <div className="topbar-user-info">
            <div className="topbar-user-name">{user?.name || 'Usuário'}</div>
            <div className="topbar-user-role">{user?.role || 'Perfil'}</div>
          </div>
          <div className="avatar avatar-md" style={{ fontSize: '13px' }}>
            {user?.name?.slice(0, 2).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
