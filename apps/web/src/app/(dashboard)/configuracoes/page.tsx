'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  Save,
  CheckCircle,
  Camera,
  RefreshCw,
  Plug,
} from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/hooks/useApi';

const TABS = [
  { key: 'clinic',         title: 'Clínica',       icon: Building2 },
  { key: 'profile',        title: 'Meu Perfil',    icon: User },
  { key: 'notifications',  title: 'Notificações',  icon: Bell },
  { key: 'integrations',   title: 'Integrações',   icon: Plug },
  { key: 'security',       title: 'Segurança',     icon: Shield },
  { key: 'appearance',     title: 'Aparência',     icon: Palette },
];


export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('clinic');
  const [localData, setLocalData] = useState<Record<string, unknown>>({});
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  // Hydrate local form state from API
  useEffect(() => {
    if (settings) setLocalData(settings as Record<string, unknown>);
  }, [settings]);

  const handleChange = (section: string, key: string, value: unknown) => {
    setLocalData((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as Record<string, unknown> ?? {}), [key]: value },
    }));
  };

  const handleSave = async () => {
    await updateSettings.mutateAsync(localData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const section = (key: string): Record<string, unknown> =>
    (localData[key] as Record<string, unknown>) ?? {};

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Settings size={28} style={{ color: 'var(--gray-500)' }} />
              Configurações
            </span>
          </h1>
          <p className="page-subtitle">Gerencie as configurações do sistema</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Salvando...</>
            ) : saved ? (
              <><CheckCircle size={16} /> Salvo!</>
            ) : (
              <><Save size={16} /> Salvar Alterações</>
            )}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 'var(--space-6)' }}>
        {/* Sidebar Tabs */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div style={{ padding: 'var(--space-2)' }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    width: '100%', padding: 'var(--space-2-5) var(--space-3)',
                    borderRadius: 'var(--radius-lg)', border: 'none',
                    background: isActive ? 'var(--primary-50)' : 'transparent',
                    color: isActive ? 'var(--primary-700)' : 'var(--gray-600)',
                    fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-normal)',
                    cursor: 'pointer', fontSize: 'var(--text-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} /> {tab.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="card" style={{ animation: 'fadeInUp 0.2s ease' }}>
          {activeTab === 'clinic' && (
            <>
              <div className="card-header">
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Dados da Clínica</h3>
              </div>
              <div className="card-body">
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--gray-400)' }}>
                    <div className="spinner spinner-lg" style={{ margin: '0 auto var(--space-3)' }} />
                    <p style={{ fontSize: 'var(--text-sm)' }}>Carregando configurações...</p>
                  </div>
                ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="input-label">Nome da Clínica</label>
                    <input className="input" value={(section('clinic').name as string) ?? ''}
                      onChange={(e) => handleChange('clinic', 'name', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">CNPJ</label>
                    <input className="input" value={(section('clinic').cnpj as string) ?? ''}
                      onChange={(e) => handleChange('clinic', 'cnpj', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">CRO</label>
                    <input className="input" value={(section('clinic').cro as string) ?? ''}
                      onChange={(e) => handleChange('clinic', 'cro', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Telefone</label>
                    <input className="input" value={(section('clinic').phone as string) ?? ''}
                      onChange={(e) => handleChange('clinic', 'phone', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">E-mail</label>
                    <input className="input" type="email" value={(section('clinic').email as string) ?? ''}
                      onChange={(e) => handleChange('clinic', 'email', e.target.value)} />
                  </div>
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="input-label">Endereço completo</label>
                    <input className="input" value={(section('clinic').address as string) ?? ''}
                      onChange={(e) => handleChange('clinic', 'address', e.target.value)} />
                  </div>
                </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'profile' && (
            <>
              <div className="card-header">
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Meu Perfil</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'var(--primary-100)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)',
                    color: 'var(--primary-600)', position: 'relative',
                  }}>
                    AD
                    <button style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--primary-500)', border: '2px solid white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'white',
                    }}>
                      <Camera size={12} />
                    </button>
                  </div>
                  <div>
                    <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--gray-900)' }}>Administrador</p>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-400)' }}>admin@clinica.com</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>
                  <div className="input-group">
                    <label className="input-label">Nome completo</label>
                    <input className="input" defaultValue="Administrador" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">E-mail</label>
                    <input className="input" type="email" defaultValue="admin@clinica.com" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Telefone</label>
                    <input className="input" type="tel" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Cargo</label>
                    <input className="input" defaultValue="Administrador" disabled />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <div className="card-header">
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Preferências de Notificação</h3>
              </div>
              <div className="card-body">
                {[
                  { title: 'Lembrete de consulta (paciente)', desc: 'WhatsApp 24h antes', enabled: true },
                  { title: 'Confirmação de agendamento', desc: 'WhatsApp ao agendar', enabled: true },
                  { title: 'Lembrete de retorno', desc: 'E-mail quando retorno estiver próximo', enabled: false },
                  { title: 'Aniversário de paciente', desc: 'Dashboard no dia', enabled: true },
                  { title: 'Pagamento atrasado', desc: 'E-mail após 5 dias de atraso', enabled: false },
                  { title: 'Backup diário', desc: 'E-mail com status do backup', enabled: true },
                ].map((item, i) => (
                  <label
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 'var(--space-4) 0',
                      borderBottom: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', color: 'var(--gray-800)' }}>{item.title}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={item.enabled}
                      style={{ width: 20, height: 20, accentColor: 'var(--primary-500)' }}
                    />
                  </label>
                ))}
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <div className="card-header">
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Segurança</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
                  <div className="input-group">
                    <label className="input-label">Senha atual</label>
                    <input className="input" type="password" placeholder="••••••••" />
                  </div>
                  <div />
                  <div className="input-group">
                    <label className="input-label">Nova senha</label>
                    <input className="input" type="password" placeholder="Mín. 8 caracteres" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Confirmar nova senha</label>
                    <input className="input" type="password" placeholder="Repita a senha" />
                  </div>
                </div>
                <div style={{ padding: 'var(--space-4)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>Autenticação de dois fatores</p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>Adicione uma camada extra de segurança</p>
                    </div>
                    <button className="btn btn-secondary btn-sm">Configurar</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'appearance' && (
            <>
              <div className="card-header">
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Aparência</h3>
              </div>
              <div className="card-body">
                <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
                  <label className="input-label">Tema</label>
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    {['Claro', 'Escuro', 'Sistema'].map((t) => (
                      <button key={t} className={`btn btn-sm ${t === 'Claro' ? 'btn-primary' : 'btn-secondary'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Cor principal</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {['#0d9488', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'].map((c) => (
                      <button
                        key={c}
                        style={{
                          width: 36, height: 36, borderRadius: '50%', border: c === '#0d9488' ? '3px solid var(--gray-900)' : '2px solid var(--gray-200)',
                          background: c, cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          {activeTab === 'integrations' && (
            <>
              <div className="card-header">
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Integrações (IA / Mensageria)</h3>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* WhatsApp */}
                <div style={{ padding: 'var(--space-4)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>WhatsApp Oficial</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>
                     <div className="input-group">
                       <label className="input-label">URL da API do WhatsApp</label>
                       <input className="input" placeholder="https://graph.facebook.com/v17.0/..." value={(section('integrations').whatsapp as Record<string, string>)?.apiUrl ?? ''}
                         onChange={(e) => handleChange('integrations', 'whatsapp', { ...(section('integrations').whatsapp as Record<string, string>), apiUrl: e.target.value })} />
                     </div>
                     <div className="input-group">
                       <label className="input-label">Access Token</label>
                       <input className="input" type="password" placeholder="EAA..." value={(section('integrations').whatsapp as Record<string, string>)?.token ?? ''}
                         onChange={(e) => handleChange('integrations', 'whatsapp', { ...(section('integrations').whatsapp as Record<string, string>), token: e.target.value })} />
                     </div>
                  </div>
                </div>

                {/* Instagram */}
                <div style={{ padding: 'var(--space-4)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>Instagram Graph API</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>
                     <div className="input-group">
                       <label className="input-label">Instagram Account ID</label>
                       <input className="input" placeholder="178414..." value={(section('integrations').instagram as Record<string, string>)?.accountId ?? ''}
                         onChange={(e) => handleChange('integrations', 'instagram', { ...(section('integrations').instagram as Record<string, string>), accountId: e.target.value })} />
                     </div>
                     <div className="input-group">
                       <label className="input-label">Access Token</label>
                       <input className="input" type="password" placeholder="IGQ..." value={(section('integrations').instagram as Record<string, string>)?.token ?? ''}
                         onChange={(e) => handleChange('integrations', 'instagram', { ...(section('integrations').instagram as Record<string, string>), token: e.target.value })} />
                     </div>
                  </div>
                </div>

                {/* Open Claw */}
                <div style={{ padding: 'var(--space-4)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>Agentes IA (OpenClaw)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>
                     <div className="input-group">
                       <label className="input-label">Gateway URL</label>
                       <input className="input" placeholder="http://localhost:3000/v1/chat/completions" value={(section('integrations').openclaw as Record<string, string>)?.agentApiUrl ?? ''}
                         onChange={(e) => handleChange('integrations', 'openclaw', { ...(section('integrations').openclaw as Record<string, string>), agentApiUrl: e.target.value })} />
                     </div>
                     <div className="input-group">
                       <label className="input-label">Agent API Key</label>
                       <input className="input" type="password" placeholder="sk-..." value={(section('integrations').openclaw as Record<string, string>)?.apiKey ?? ''}
                         onChange={(e) => handleChange('integrations', 'openclaw', { ...(section('integrations').openclaw as Record<string, string>), apiKey: e.target.value })} />
                     </div>
                     <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                          <input type="checkbox" style={{ width: 16, height: 16 }} checked={(section('integrations').openclaw as Record<string, boolean>)?.autoReply ?? false}
                            onChange={(e) => handleChange('integrations', 'openclaw', { ...(section('integrations').openclaw as Record<string, any>), autoReply: e.target.checked })} />
                          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>Ativar resposta automática com IA no WhatsApp/Instagram</span>
                        </label>
                     </div>
                  </div>
                </div>
                {/* Google Agenda */}
                <div style={{ padding: 'var(--space-4)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>Google Agenda</h4>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', marginBottom: 'var(--space-4)' }}>Sincronização bidirecional de eventos e herança de feriados automáticos da agenda Google.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>
                     <div className="input-group">
                       <label className="input-label">Client ID (Google Cloud)</label>
                       <input className="input" placeholder="123456...apps.googleusercontent.com" value={(section('integrations').googleCalendar as Record<string, string>)?.clientId ?? ''}
                         onChange={(e) => handleChange('integrations', 'googleCalendar', { ...(section('integrations').googleCalendar as Record<string, string>), clientId: e.target.value })} />
                     </div>
                     <div className="input-group">
                       <label className="input-label">Client Secret</label>
                       <input className="input" type="password" placeholder="GOCSPX-..." value={(section('integrations').googleCalendar as Record<string, string>)?.clientSecret ?? ''}
                         onChange={(e) => handleChange('integrations', 'googleCalendar', { ...(section('integrations').googleCalendar as Record<string, string>), clientSecret: e.target.value })} />
                     </div>
                     <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                          <input type="checkbox" style={{ width: 16, height: 16 }} checked={(section('integrations').googleCalendar as Record<string, boolean>)?.syncHolidays ?? true}
                            onChange={(e) => handleChange('integrations', 'googleCalendar', { ...(section('integrations').googleCalendar as Record<string, any>), syncHolidays: e.target.checked })} />
                          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>Ativar sincronização bidirecional completa e herança de feriados do Google</span>
                        </label>
                     </div>
                  </div>
                </div>

                {/* Google Drive */}
                <div style={{ padding: 'var(--space-4)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>Google Drive</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>
                     <div className="input-group">
                       <label className="input-label">Client ID</label>
                       <input className="input" placeholder="123456...apps.googleusercontent.com" value={(section('integrations').googleDrive as Record<string, string>)?.clientId ?? ''}
                         onChange={(e) => handleChange('integrations', 'googleDrive', { ...(section('integrations').googleDrive as Record<string, string>), clientId: e.target.value })} />
                     </div>
                     <div className="input-group">
                       <label className="input-label">Client Secret</label>
                       <input className="input" type="password" placeholder="GOCSPX-..." value={(section('integrations').googleDrive as Record<string, string>)?.clientSecret ?? ''}
                         onChange={(e) => handleChange('integrations', 'googleDrive', { ...(section('integrations').googleDrive as Record<string, string>), clientSecret: e.target.value })} />
                     </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </>
  );
}
