'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Wifi,
  WifiOff,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/hooks/useApi';
import api from '@/lib/api';

const TABS = [
  { key: 'clinic',         title: 'Clínica',       icon: Building2 },
  { key: 'profile',        title: 'Meu Perfil',    icon: User },
  { key: 'notifications',  title: 'Notificações',  icon: Bell },
  { key: 'integrations',   title: 'Integrações',   icon: Plug },
  { key: 'security',       title: 'Segurança',     icon: Shield },
  { key: 'appearance',     title: 'Aparência',     icon: Palette },
];


// ── WhatsApp QR pairing state ────────────────────────────────────────────────
type WaStatus = 'idle' | 'loading' | 'qr' | 'connected' | 'error';

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('clinic');
  const [localData, setLocalData] = useState<Record<string, unknown>>({});
  const [saved, setSaved] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [checkingGoogle, setCheckingGoogle] = useState(true);

  // WhatsApp pairing
  const [waStatus, setWaStatus] = useState<WaStatus>('idle');
  const [waQr, setWaQr] = useState<string | null>(null);
  const [waPhone, setWaPhone] = useState<string | null>(null);

  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  // Hydrate local form state from API
  useEffect(() => {
    if (settings) setLocalData(settings as Record<string, unknown>);
  }, [settings]);

  // Check real Google connection status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab')) {
        setActiveTab(params.get('tab') as string);
      }
      // Optimistic hint from callback redirect
      if (params.get('google_sync') === 'success') {
        setGoogleConnected(true);
        setCheckingGoogle(false);
      }
    }
    // Always verify with the backend (the query-string hint is just a flash)
    api.get('/integrations/google/status')
      .then((res) => {
        setGoogleConnected(res.data?.connected === true);
      })
      .catch(() => {
        setGoogleConnected(false);
      })
      .finally(() => setCheckingGoogle(false));
  }, []);

  // WhatsApp: fetch QR from OpenClaw gateway
  const fetchWaQr = useCallback(async () => {
    const gatewayUrl = (localData?.integrations as Record<string, Record<string, string>>)?.openclaw?.agentApiUrl;
    if (!gatewayUrl) { setWaStatus('error'); return; }
    // Derive base URL: strip path after port
    const base = gatewayUrl.replace(/\/v1\/.*$/, '');
    setWaStatus('loading');
    try {
      const r = await fetch(`${base}/v1/channels/whatsapp/qr`, { headers: { 'x-api-key': (localData?.integrations as Record<string, Record<string, string>>)?.openclaw?.apiKey ?? '' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      if (d.status === 'connected') {
        setWaStatus('connected');
        setWaPhone(d.phone ?? null);
        setWaQr(null);
      } else if (d.qr) {
        setWaStatus('qr');
        setWaQr(d.qr);
      } else {
        setWaStatus('error');
      }
    } catch {
      setWaStatus('error');
    }
  }, [localData]);

  // Poll every 30s while QR is displayed
  useEffect(() => {
    if (waStatus !== 'qr') return;
    const t = setInterval(fetchWaQr, 30_000);
    return () => clearInterval(t);
  }, [waStatus, fetchWaQr]);

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

                {/* WhatsApp QR Code Pairing */}
                <div style={{ padding: 'var(--space-4)', border: `1px solid ${waStatus === 'connected' ? 'var(--success-300)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius-lg)', background: waStatus === 'connected' ? 'var(--success-25, #f0fdf4)' : 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <QrCode size={18} style={{ color: waStatus === 'connected' ? 'var(--success-600)' : 'var(--gray-600)' }} />
                      <h4 style={{ fontWeight: 'var(--font-semibold)', margin: 0 }}>WhatsApp via QR Code (OpenClaw)</h4>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {waStatus === 'connected' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)', color: 'var(--success-600)', fontWeight: 'var(--font-medium)' }}>
                          <Wifi size={14} /> Conectado{waPhone ? ` · ${waPhone}` : ''}
                        </span>
                      )}
                      {waStatus === 'error' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)', color: 'var(--error-500)' }}>
                          <WifiOff size={14} /> Desconectado
                        </span>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={fetchWaQr}
                        disabled={waStatus === 'loading'}
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                      >
                        <RefreshCw size={13} style={{ animation: waStatus === 'loading' ? 'spin 1s linear infinite' : 'none' }} />
                        {waStatus === 'idle' ? 'Gerar QR Code' : waStatus === 'loading' ? 'Aguardando...' : 'Atualizar'}
                      </button>
                    </div>
                  </div>

                  {waStatus === 'idle' && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--gray-400)', fontSize: 'var(--text-sm)' }}>
                      <Smartphone size={32} style={{ margin: '0 auto var(--space-2)', display: 'block', opacity: 0.4 }} />
                      Clique em "Gerar QR Code" para parear o WhatsApp da clínica com a Clara.
                    </div>
                  )}

                  {waStatus === 'loading' && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                      <div className="spinner spinner-lg" style={{ margin: '0 auto var(--space-3)' }} />
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>Conectando ao OpenClaw...</p>
                    </div>
                  )}

                  {waStatus === 'qr' && waQr && (
                    <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start' }}>
                      <div style={{ flexShrink: 0 }}>
                        <img
                          src={waQr.startsWith('data:') ? waQr : `data:image/png;base64,${waQr}`}
                          alt="WhatsApp QR Code"
                          style={{ width: 180, height: 180, borderRadius: 'var(--radius-lg)', border: '4px solid var(--gray-100)' }}
                        />
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)', lineHeight: 1.6 }}>
                        <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--gray-800)', marginBottom: 'var(--space-2)' }}>Como parear:</p>
                        <ol style={{ paddingLeft: 'var(--space-4)', margin: 0 }}>
                          <li>Abra o WhatsApp no celular da clínica</li>
                          <li>Toque em <strong>⋮ Menu → Aparelhos conectados</strong></li>
                          <li>Toque em <strong>Conectar um aparelho</strong></li>
                          <li>Aponte a câmera para o QR Code ao lado</li>
                        </ol>
                        <p style={{ marginTop: 'var(--space-3)', color: 'var(--gray-400)', fontSize: 'var(--text-xs)' }}>O QR atualiza automaticamente a cada 30 segundos.</p>
                      </div>
                    </div>
                  )}

                  {waStatus === 'connected' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--success-50)', borderRadius: 'var(--radius-md)' }}>
                      <CheckCircle size={20} style={{ color: 'var(--success-600)', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', color: 'var(--success-800)' }}>WhatsApp conectado com sucesso!</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--success-600)' }}>A Clara está respondendo automaticamente pelo número da clínica.</p>
                      </div>
                    </div>
                  )}

                  {waStatus === 'error' && (
                    <div style={{ padding: 'var(--space-3)', background: 'var(--error-50, #fef2f2)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--error-700, #b91c1c)' }}>
                      Não foi possível conectar ao OpenClaw. Verifique se o <strong>Gateway URL</strong> está correto e acessível.
                    </div>
                  )}
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
                  <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                        <p style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', color: 'var(--gray-900)' }}>Autorização do Profissional</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>Cada profissional deve autorizar sua conta individual para sincronizar eventos.</p>
                     </div>
                     <button
                        className={googleConnected ? "btn btn-primary" : "btn btn-secondary"}
                        style={googleConnected ? { backgroundColor: 'var(--success-500)', borderColor: 'var(--success-500)', color: 'white' } : {}}
                        disabled={checkingGoogle}
                        onClick={async () => {
                           if (googleConnected) return; // Already connected, no-op
                           try {
                             const res = await api.get('/integrations/google/connect');
                             if (res.data?.url) {
                               window.location.href = res.data.url;
                             }
                           } catch (err) {
                             console.error(err);
                             alert('Erro ao gerar link de autorização do Google.');
                           }
                        }}
                     >
                        {checkingGoogle ? (
                          <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, marginRight: 8 }} /> Verificando...</>
                        ) : googleConnected ? (
                          <><CheckCircle size={16} style={{ marginRight: 8 }} /> Google Agenda Conectado</>
                        ) : (
                          <><Plug size={16} style={{ marginRight: 8 }} /> Autorizar Google Agenda</>
                        )}
                     </button>
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
