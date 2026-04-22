'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Calendar,
  DollarSign,
  User,
  Clock,
  Check,
  X,
} from 'lucide-react';

const NOTIFICATIONS = [
  {
    id: '1',
    type: 'appointment',
    title: 'Consulta em 30 min',
    message: 'Maria Silva — Toxina Botulínica — Sala HOF',
    time: '10 min atrás',
    read: false,
    icon: Calendar,
    color: 'var(--primary-500)',
  },
  {
    id: '2',
    type: 'payment',
    title: 'Pagamento recebido',
    message: 'Carlos Lima — R$ 650 via PIX',
    time: '25 min atrás',
    read: false,
    icon: DollarSign,
    color: 'var(--success-500)',
  },
  {
    id: '3',
    type: 'patient',
    title: 'Novo paciente cadastrado',
    message: 'Fernanda Oliveira — via site',
    time: '1h atrás',
    read: false,
    icon: User,
    color: 'var(--teal-500)',
  },
  {
    id: '4',
    type: 'appointment',
    title: 'Retorno pendente',
    message: 'Roberto Alves — retorno desde 10/04',
    time: '2h atrás',
    read: true,
    icon: Clock,
    color: 'var(--warning-500)',
  },
  {
    id: '5',
    type: 'payment',
    title: 'Boleto atrasado',
    message: 'Roberto Alves — R$ 1.000 vencido em 14/04',
    time: '3h atrás',
    read: true,
    icon: DollarSign,
    color: 'var(--error-500)',
  },
];

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="topbar-notification"
        title="Notificações"
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative' }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--error-500)',
            border: '2px solid white',
          }} />
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 380, maxHeight: 480,
          background: 'white', borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)', border: '1px solid var(--gray-100)',
          zIndex: 1000, animation: 'fadeInUp 0.2s ease',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--gray-100)',
          }}>
            <div>
              <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>Notificações</div>
              {unreadCount > 0 && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--primary-500)' }}>{unreadCount} não lidas</div>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 'var(--text-xs)', color: 'var(--primary-500)',
                  fontWeight: 'var(--font-medium)',
                }}
              >
                <Check size={12} style={{ marginRight: 4, verticalAlign: -2 }} />
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifications.map((notif) => {
              const Icon = notif.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  style={{
                    display: 'flex', gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-5)',
                    borderBottom: '1px solid var(--gray-50)',
                    background: notif.read ? 'white' : 'var(--primary-50)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: `${notif.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} style={{ color: notif.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: notif.read ? 'var(--font-normal)' : 'var(--font-semibold)',
                      color: 'var(--gray-800)',
                    }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginTop: 2 }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--gray-400)', marginTop: 4 }}>
                      {notif.time}
                    </div>
                  </div>
                  {!notif.read && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--primary-500)',
                      flexShrink: 0, marginTop: 8,
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: 'var(--space-3)',
            borderTop: '1px solid var(--gray-100)', textAlign: 'center',
          }}>
            <button
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-xs)', color: 'var(--primary-500)',
                fontWeight: 'var(--font-medium)',
              }}
            >
              Ver todas as notificações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
