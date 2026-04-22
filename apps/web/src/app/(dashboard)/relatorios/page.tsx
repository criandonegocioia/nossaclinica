'use client';

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const REVENUE_DATA = [
  { month: 'Jan', value: 28500 },
  { month: 'Fev', value: 32100 },
  { month: 'Mar', value: 29800 },
  { month: 'Abr', value: 35400 },
  { month: 'Mai', value: 31200 },
  { month: 'Jun', value: 38700 },
  { month: 'Jul', value: 42100 },
  { month: 'Ago', value: 39500 },
  { month: 'Set', value: 44200 },
  { month: 'Out', value: 41800 },
  { month: 'Nov', value: 47300 },
  { month: 'Dez', value: 52100 },
];

const PROCEDURES_DATA = [
  { name: 'Toxina Botulínica', count: 87, revenue: 52200, color: 'var(--primary-500)' },
  { name: 'Ácido Hialurônico', count: 64, revenue: 89600, color: 'var(--teal-500)' },
  { name: 'Restauração', count: 112, revenue: 33600, color: 'var(--accent-500)' },
  { name: 'Endodontia', count: 34, revenue: 34000, color: 'var(--warning-500)' },
  { name: 'Profilaxia', count: 156, revenue: 23400, color: 'var(--success-500)' },
  { name: 'Bioestimulador', count: 28, revenue: 42000, color: '#8b5cf6' },
  { name: 'Ortodontia', count: 45, revenue: 67500, color: '#ec4899' },
  { name: 'Cirurgia', count: 18, revenue: 36000, color: '#f97316' },
];

const KPI_CARDS = [
  { title: 'Faturamento Anual', value: 'R$ 462.700', change: '+18%', positive: true, icon: DollarSign },
  { title: 'Total Atendimentos', value: '1.284', change: '+12%', positive: true, icon: Calendar },
  { title: 'Pacientes Novos', value: '186', change: '+23%', positive: true, icon: Users },
  { title: 'Ticket Médio', value: 'R$ 360', change: '-3%', positive: false, icon: TrendingUp },
];

export default function RelatoriosPage() {
  const [period, setPeriod] = useState('year');
  const maxRevenue = Math.max(...REVENUE_DATA.map((d) => d.value));
  const maxProcCount = Math.max(...PROCEDURES_DATA.map((d) => d.count));

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <BarChart3 size={28} style={{ color: 'var(--primary-500)' }} />
              Relatórios
            </span>
          </h1>
          <p className="page-subtitle">Análises e indicadores de desempenho</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {[
              { value: 'month', label: 'Mês' },
              { value: 'quarter', label: 'Trimestre' },
              { value: 'year', label: 'Ano' },
            ].map((p) => (
              <button
                key={p.value}
                className={`btn btn-sm ${period === p.value ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPeriod(p.value)}
                style={{ borderRadius: 0 }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary">
            <Download size={16} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-8)' }}>
        {KPI_CARDS.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="stat-card" style={{ animationDelay: `${i * 60}ms` }}>
              <div className={`stat-icon ${kpi.positive ? 'success' : 'warning'}`}>
                <Icon size={22} />
              </div>
              <div className="stat-content">
                <div className="stat-title">{kpi.title}</div>
                <div className="stat-value">{kpi.value}</div>
                <div className={`stat-change ${kpi.positive ? 'positive' : 'negative'}`}>
                  {kpi.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {kpi.change} vs ano anterior
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Faturamento Mensal</h3>
          </div>
          <div className="card-body" style={{ padding: 'var(--space-4) var(--space-5) var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-1)', height: 200 }}>
              {REVENUE_DATA.map((d, i) => {
                const height = (d.value / maxRevenue) * 180;
                return (
                  <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: '9px', color: 'var(--gray-400)', fontWeight: 'var(--font-medium)' }}>
                      {(d.value / 1000).toFixed(0)}k
                    </span>
                    <div
                      style={{
                        width: '100%', maxWidth: 32, height, borderRadius: '4px 4px 0 0',
                        background: i === new Date().getMonth()
                          ? 'linear-gradient(180deg, var(--primary-400), var(--primary-600))'
                          : 'linear-gradient(180deg, var(--gray-200), var(--gray-300))',
                        transition: 'height 0.5s ease',
                        animation: `fadeInUp 0.4s ease backwards ${i * 50}ms`,
                      }}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Procedures Ranking */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Top Procedimentos</h3>
          </div>
          <div className="card-body" style={{ padding: 'var(--space-2) var(--space-5) var(--space-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {PROCEDURES_DATA.sort((a, b) => b.revenue - a.revenue).map((proc, i) => (
                <div key={proc.name} style={{ animation: `fadeInUp 0.3s ease backwards ${i * 40}ms` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)', fontWeight: 'var(--font-medium)' }}>
                      {proc.name}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                      R$ {proc.revenue.toLocaleString('pt-BR')} · {proc.count}x
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--gray-100)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${(proc.count / maxProcCount) * 100}%`,
                      background: proc.color,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Demographics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Gender */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>Gênero</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-6)' }}>
            <div style={{ position: 'relative', width: 140, height: 140 }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="14" fill="none" stroke="var(--gray-100)" strokeWidth="4" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="var(--primary-400)" strokeWidth="4"
                  strokeDasharray="61.6 26.4" strokeLinecap="round" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="var(--accent-400)" strokeWidth="4"
                  strokeDasharray="0 61.6 26.4" strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--gray-900)' }}>342</span>
                <span style={{ fontSize: '10px', color: 'var(--gray-400)' }}>pacientes</span>
              </div>
            </div>
          </div>
          <div style={{ padding: '0 var(--space-5) var(--space-4)', display: 'flex', justifyContent: 'center', gap: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary-400)' }} />
              Feminino 70%
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-400)' }} />
              Masculino 30%
            </div>
          </div>
        </div>

        {/* Age Range */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>Faixa Etária</h3>
          </div>
          <div className="card-body" style={{ padding: 'var(--space-4) var(--space-5)' }}>
            {[
              { range: '18-25', pct: 15 },
              { range: '26-35', pct: 32 },
              { range: '36-45', pct: 28 },
              { range: '46-55', pct: 16 },
              { range: '56+', pct: 9 },
            ].map((item, i) => (
              <div key={item.range} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2-5)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', width: 40, textAlign: 'right' }}>{item.range}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--gray-100)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${item.pct}%`,
                    background: `hsl(${180 + i * 25}, 60%, 50%)`,
                    animation: `fadeIn 0.5s ease backwards ${i * 80}ms`,
                  }} />
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', width: 30 }}>{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Origin */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>Origem</h3>
          </div>
          <div className="card-body" style={{ padding: 'var(--space-3) var(--space-5)' }}>
            {[
              { source: 'Indicação', pct: 42, icon: '👥' },
              { source: 'Instagram', pct: 28, icon: '📱' },
              { source: 'Google', pct: 18, icon: '🔍' },
              { source: 'Site', pct: 8, icon: '🌐' },
              { source: 'Outros', pct: 4, icon: '📋' },
            ].map((item, i) => (
              <div key={item.source} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-2) 0',
                borderBottom: i < 4 ? '1px solid var(--gray-50)' : 'none',
              }}>
                <span style={{ fontSize: 'var(--text-lg)' }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>{item.source}</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--gray-900)' }}>{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
