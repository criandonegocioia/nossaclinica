'use client';

import { useState } from 'react';

import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useDashboardStats, useSchedulesToday, usePatientStats } from '@/hooks/useApi';

export default function DashboardPage() {
  const { data: scheduleStats } = useDashboardStats();
  const { data: todaySchedules } = useSchedulesToday();
  const { data: patientStats } = usePatientStats();

  const stats = [
    {
      title: 'Pacientes Ativos',
      value: patientStats?.total ?? '—',
      icon: Users,
      change: patientStats?.newThisMonth ? `+${patientStats.newThisMonth} este mês` : '',
      variant: 'primary',
    },
    {
      title: 'Consultas Hoje',
      value: scheduleStats?.today ?? '—',
      icon: Calendar,
      change: scheduleStats?.confirmados ? `${scheduleStats.confirmados} confirmados` : '',
      variant: 'success',
    },
    {
      title: 'Taxa Conversão',
      value: scheduleStats?.conversionRate ? `${scheduleStats.conversionRate}%` : '—',
      icon: TrendingUp,
      change: '+5% vs mês anterior',
      variant: 'warning',
    },
    {
      title: 'Faturamento Mês',
      value: scheduleStats?.revenue ? `R$ ${Number(scheduleStats.revenue).toLocaleString('pt-BR')}` : '—',
      icon: DollarSign,
      change: '+12% vs anterior',
      variant: 'accent',
    },
  ];

  const appointments = todaySchedules ?? [];

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral da clínica</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-8)' }}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="stat-card" style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`stat-icon ${stat.variant}`}>
                <Icon size={22} />
              </div>
              <div className="stat-content">
                <div className="stat-title">{stat.title}</div>
                <div className="stat-value">{stat.value}</div>
                {stat.change && (
                  <div className="stat-change positive">
                    <ArrowUpRight size={14} /> {stat.change}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-6)' }}>
        {/* Today Schedule */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
              Agenda de Hoje
            </h3>
            <Link href="/agenda" className="btn btn-ghost btn-sm">
              Ver tudo <ChevronRight size={14} />
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {appointments.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--gray-400)' }}>
                <Calendar size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.5 }} />
                <p>Nenhum atendimento agendado para hoje</p>
              </div>
            ) : (
              <div>
                {appointments.slice(0, 8).map((apt: any, i: number) => (
                  <div
                    key={apt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-4)',
                      padding: 'var(--space-3-5) var(--space-5)',
                      borderBottom: '1px solid var(--gray-50)',
                      animation: `fadeInUp 0.3s ease backwards ${i * 40}ms`,
                    }}
                  >
                    <div style={{
                      width: 48, textAlign: 'center', flexShrink: 0,
                    }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--primary-600)' }}>
                        {new Date(apt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>
                        {new Date(apt.endAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{
                      width: 3, height: 36, borderRadius: 2,
                      background: apt.colorCode || 'var(--primary-400)',
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 'var(--font-medium)', color: 'var(--gray-900)',
                        fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {apt.patient?.name || 'Bloqueio'}
                      </div>
                      <div style={{
                        fontSize: 'var(--text-xs)', color: 'var(--gray-400)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {apt.procedure?.name || apt.notes || '—'}
                      </div>
                    </div>
                    <span className={`badge badge-dot ${
                      apt.status === 'CONFIRMADO' ? 'badge-success' :
                      apt.status === 'EM_ATENDIMENTO' ? 'badge-primary' :
                      apt.status === 'CONCLUIDO' ? 'badge-neutral' :
                      'badge-warning'
                    }`} style={{ fontSize: '11px' }}>
                      {apt.status === 'CONFIRMADO' ? 'Confirmado' :
                       apt.status === 'AGENDADO' ? 'Agendado' :
                       apt.status === 'EM_ATENDIMENTO' ? 'Atendendo' :
                       apt.status === 'CONCLUIDO' ? 'Concluído' : apt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Next Patient Widget */}
          {appointments.filter((a: any) => new Date(a.startAt) > new Date() && !['CONCLUIDO', 'CANCELADO', 'FALTOU'].includes(a.status)).length > 0 && (
            <div className="card" style={{ border: '1px solid var(--primary-200)', background: 'linear-gradient(135deg, var(--primary-50), white)' }}>
              <div className="card-body" style={{ padding: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--primary-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'var(--space-3)' }}>
                  ⏰ Próximo Paciente
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div className="avatar avatar-md" style={{ fontSize: '13px', background: 'var(--primary-100)', color: 'var(--primary-700)' }}>
                    {appointments.filter((a: any) => new Date(a.startAt) > new Date())[0]?.patient?.name?.substring(0, 2).toUpperCase() || 'P'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>
                      {appointments.filter((a: any) => new Date(a.startAt) > new Date())[0]?.patient?.name || 'Não informado'}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                      {appointments.filter((a: any) => new Date(a.startAt) > new Date())[0]?.procedure?.name || 'Procedimento'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={11} /> 
                    {new Date(appointments.filter((a: any) => new Date(a.startAt) > new Date())[0]?.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
                Ações Rápidas
              </h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {[
                { label: 'Novo Paciente', href: '/pacientes/novo', icon: Users },
                { label: 'Agendar Consulta', href: '/agenda', icon: Calendar },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="btn btn-ghost"
                    style={{ justifyContent: 'flex-start', width: '100%', padding: 'var(--space-3) var(--space-4)' }}
                  >
                    <Icon size={16} /> {action.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Birthdays */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>🎂 Aniversariantes do Dia</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {patientStats?.birthdaysToday && Array.isArray(patientStats.birthdaysToday) && patientStats.birthdaysToday.length > 0 ? (
                patientStats.birthdaysToday.map((p: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--gray-700)' }}>{p.name}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success-600)', fontWeight: 'var(--font-semibold)' }}>Hoje</span>
                  </div>
                ))
              ) : (
                 <div style={{ padding: 'var(--space-2) 0', fontSize: 'var(--text-sm)', color: 'var(--gray-400)' }}>
                   Nenhum aniversariante hoje
                 </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
