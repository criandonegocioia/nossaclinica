'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Providers } from '@/lib/providers';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Menu } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Close mobile menu on route change
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Close on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--gray-50)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--gray-400)', fontSize: 'var(--text-sm)' }}>
            Carregando sistema...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Providers>
      <div className="app-layout">
        {/* Mobile overlay */}
        <div
          className={`sidebar-mobile-overlay ${mobileMenuOpen ? 'visible' : ''}`}
          onClick={closeMobileMenu}
          aria-hidden="true"
        />

        {/* Sidebar with mobile-open class */}
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onMobileClose={closeMobileMenu}
        />

        <main className="main-content">
          <TopBar
            onMobileMenuToggle={() => setMobileMenuOpen((v) => !v)}
          />
          <div className="page-content">
            {children}
          </div>
        </main>
      </div>
    </Providers>
  );
}
