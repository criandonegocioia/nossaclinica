'use client';

import { useState } from 'react';
import {
  Kanban, Plus, X, Save, Instagram, MessageCircle,
  Globe, Users, TrendingUp, DollarSign, User, CheckCircle,
  Phone, Mail, ArrowRight, ChevronLeft, ArrowLeft,
} from 'lucide-react';
import { useLeads, useCreateLead, useUpdateLeadStage, useConvertLead } from '@/hooks/useApi';

const STAGES = [
  { id: 'LEAD',         label: 'Lead',            color: 'var(--gray-400)' },
  { id: 'CONTACTED',    label: 'Contatado',        color: 'var(--primary-400)' },
  { id: 'SCHEDULED',    label: 'Agendou',          color: 'var(--primary-600)' },
  { id: 'EVALUATED',    label: 'Avaliou',          color: 'var(--warning-500)' },
  { id: 'QUOTE_SENT',   label: 'Orçamento',        color: 'var(--warning-600)' },
  { id: 'NEGOTIATION',  label: 'Negociação',       color: 'var(--accent-500)' },
  { id: 'CLOSED_WON',   label: 'Fechou ✅',        color: 'var(--success-600)' },
  { id: 'LOYAL',        label: 'Fidelizado ⭐',    color: 'var(--success-700)' },
];

const SOURCE_OPTIONS = [
  { value: 'INSTAGRAM', label: 'Instagram',  icon: Instagram,     contactLabel: 'Instagram',              contactPlaceholder: '@usuario' },
  { value: 'WHATSAPP',  label: 'WhatsApp',   icon: MessageCircle, contactLabel: 'WhatsApp',               contactPlaceholder: '(85) 99999-0000' },
  { value: 'TELEFONE',  label: 'Telefone',   icon: Phone,         contactLabel: 'Telefone',               contactPlaceholder: '(85) 3333-0000' },
  { value: 'SITE',      label: 'Site',       icon: Globe,         contactLabel: 'E-mail ou telefone',     contactPlaceholder: 'contato@email.com' },
  { value: 'INDICACAO', label: 'Indicação',  icon: Users,         contactLabel: 'WhatsApp / Telefone',    contactPlaceholder: '(85) 99999-0000' },
  { value: 'GOOGLE',    label: 'Google',     icon: Globe,         contactLabel: 'E-mail ou telefone',     contactPlaceholder: 'contato@email.com' },
  { value: 'FACEBOOK',  label: 'Facebook',   icon: Globe,         contactLabel: 'Facebook ou WhatsApp',   contactPlaceholder: 'Perfil ou número' },
  { value: 'EVENTO',    label: 'Evento',     icon: Users,         contactLabel: 'WhatsApp / Telefone',    contactPlaceholder: '(85) 99999-0000' },
  { value: 'OUTRO',     label: 'Outro',      icon: Globe,         contactLabel: 'Contato',                contactPlaceholder: 'E-mail, telefone ou rede social' },
];

const SOURCE_ICON: Record<string, React.ReactNode> = {
  INSTAGRAM:  <Instagram size={12} />,
  WHATSAPP:   <MessageCircle size={12} />,
  TELEFONE:   <Phone size={12} />,
  SITE:       <Globe size={12} />,
  INDICACAO:  <Users size={12} />,
  GOOGLE:     <Globe size={12} />,
  FACEBOOK:   <Globe size={12} />,
  EVENTO:     <Users size={12} />,
  OUTRO:      <Globe size={12} />,
};

const MOCK_LEADS = [
  { id: '1', name: 'Camila Ferreira', phone: '(85) 99876-5432', email: 'camila@email.com', instagram: '@camilaferreira', source: 'INSTAGRAM', status: 'LEAD', interest: 'Toxina Botulínica', value: 1200, notes: 'Fotografia da bioestimulação no Instagram', createdAt: '2026-04-15' },
  { id: '2', name: 'Rafael Costa', phone: '(85) 98765-4321', email: '', instagram: '', source: 'WHATSAPP', status: 'CONTACTED', interest: 'Clareamento dental', value: 800, notes: 'Entrou em contato via WhatsApp', createdAt: '2026-04-14' },
  { id: '3', name: 'Beatriz Lima', phone: '(85) 97654-3210', email: 'beatriz@email.com', instagram: '@bealima', source: 'INDICACAO', status: 'SCHEDULED', interest: 'Harmonização facial', value: 3500, notes: 'Indicação da Dra. Ana', createdAt: '2026-04-12' },
  { id: '4', name: 'João Mendes', phone: '(85) 96543-2109', email: 'joao@email.com', instagram: '', source: 'SITE', status: 'EVALUATED', interest: 'Implante dentário', value: 5000, notes: 'Veio do formulário do site', createdAt: '2026-04-10' },
  { id: '5', name: 'Fernanda Alves', phone: '(85) 95432-1098', email: 'fernanda@email.com', instagram: '@fernandaalves', source: 'INSTAGRAM', status: 'QUOTE_SENT', interest: 'Ácido Hialurônico', value: 2200, notes: 'Recebeu orçamento por email', createdAt: '2026-04-08' },
  { id: '6', name: 'Marco Souza', phone: '(85) 94321-0987', email: '', instagram: '', source: 'WHATSAPP', status: 'NEGOTIATION', interest: 'Bioestimulador', value: 4000, notes: 'Negociando parcelamento', createdAt: '2026-04-05' },
  { id: '7', name: 'Ana Rodrigues', phone: '(85) 93210-9876', email: 'ana@email.com', instagram: '@anarodrigues', source: 'INDICACAO', status: 'CLOSED_WON', interest: 'Toxina + HA', value: 3800, notes: 'Fechou pacote completo', createdAt: '2026-04-01' },
  { id: '8', name: 'Paulo Neto', phone: '(85) 92109-8765', email: 'paulo@email.com', instagram: '', source: 'GOOGLE', status: 'LOYAL', interest: 'Manutenção HOF', value: 1500, notes: 'Retorno regular trimestral', createdAt: '2026-03-15' },
];

type Lead = typeof MOCK_LEADS[0];
type View = 'kanban' | 'new' | 'detail';

export default function CRMPage() {
  const [view, setView] = useState<View>('kanban');
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState(MOCK_LEADS);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({ name: '', source: 'INSTAGRAM', contact: '', email: '', interest: '', value: '', notes: '' });
  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const createLead = useCreateLead();
  const updateStage = useUpdateLeadStage();
  const convertLead = useConvertLead();

  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (stageId: string) => {
    if (!draggingId) return;
    setLeads((prev) => prev.map((l) => l.id === draggingId ? { ...l, status: stageId } : l));
    updateStage.mutate({ id: draggingId, stage: stageId });
    setDraggingId(null);
  };

  const openDetail = (lead: Lead) => { setDetailLead(lead); setView('detail'); };
  const openNew = () => { setForm({ name: '', source: 'INSTAGRAM', contact: '', email: '', interest: '', value: '', notes: '' }); setView('new'); };
  const backToKanban = () => { setView('kanban'); setDetailLead(null); };

  const sourceConfig = SOURCE_OPTIONS.find((s) => s.value === form.source) ?? SOURCE_OPTIONS[0];

  const handleCreateLead = async () => {
    const phone = ['WHATSAPP', 'TELEFONE', 'INDICACAO', 'EVENTO'].includes(form.source) ? form.contact : '';
    const instagram = form.source === 'INSTAGRAM' ? form.contact : '';
    const emailVal = ['SITE', 'GOOGLE'].includes(form.source) ? form.contact : form.email;

    const newLead = {
      name: form.name,
      phone, instagram, email: emailVal,
      source: form.source,
      interest: form.interest,
      value: parseInt(form.value) || 0,
      notes: form.notes,
      id: Date.now().toString(),
      status: 'LEAD',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setLeads((prev) => [...prev, newLead]);
    try { await createLead.mutateAsync(newLead); } catch { /* still add locally */ }
    backToKanban();
  };

  // KPIs
  const total = leads.length;
  const pipeline = leads.filter((l) => !['CLOSED_WON', 'LOYAL'].includes(l.status)).reduce((a, l) => a + l.value, 0);
  const won = leads.filter((l) => l.status === 'CLOSED_WON').length;
  const convRate = total > 0 ? Math.round((won / total) * 100) : 0;

  // ═════════════════════════════════════════════════════════
  // VIEW: Novo Lead (inline)
  // ═════════════════════════════════════════════════════════
  if (view === 'new') {
    const SourceIcon = sourceConfig.icon;
    return (
      <>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <button className="btn btn-ghost btn-sm" onClick={backToKanban} style={{ marginBottom: 'var(--space-3)' }}>
            <ArrowLeft size={16} /> Voltar para o funil
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Plus size={24} style={{ color: 'var(--primary-500)' }} /> Cadastrar Novo Lead
          </h1>
          <p className="page-subtitle">Preencha os dados do lead para acompanhar no funil</p>
        </div>

        <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>

              {/* 1. Nome */}
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label required">Nome completo</label>
                <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nome do lead" autoFocus />
              </div>

              {/* 2. Origem — logo após o nome */}
              <div className="input-group">
                <label className="input-label required">Origem</label>
                <select className="input" value={form.source} onChange={(e) => { set('source', e.target.value); set('contact', ''); }}>
                  {SOURCE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* 3. Campo de contato dinâmico — baseado na origem */}
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <SourceIcon size={14} style={{ color: 'var(--primary-500)' }} />
                  {sourceConfig.contactLabel}
                </label>
                <input className="input" value={form.contact} onChange={(e) => set('contact', e.target.value)}
                  placeholder={sourceConfig.contactPlaceholder} />
              </div>

              {/* 4. E-mail (extra, sempre disponível) */}
              <div className="input-group">
                <label className="input-label">E-mail</label>
                <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@exemplo.com" />
              </div>

              {/* 5. Interesse */}
              <div className="input-group">
                <label className="input-label">Interesse principal</label>
                <input className="input" value={form.interest} onChange={(e) => set('interest', e.target.value)} placeholder="Ex: Toxina Botulínica, Clareamento..." />
              </div>

              {/* 6. Valor */}
              <div className="input-group">
                <label className="input-label">Valor estimado (R$)</label>
                <input className="input" type="number" min="0" step="0.01" value={form.value} onChange={(e) => set('value', e.target.value)} placeholder="0,00" />
              </div>

              {/* 7. Observações */}
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label">Observações</label>
                <textarea className="input" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)}
                  placeholder="Informações adicionais sobre o lead..." style={{ resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
              <button className="btn btn-secondary" onClick={backToKanban}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreateLead} disabled={!form.name || createLead.isPending}>
                {createLead.isPending
                  ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</>
                  : <><Save size={16} /> Cadastrar Lead</>}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═════════════════════════════════════════════════════════
  // VIEW: Detalhe do Lead (inline)
  // ═════════════════════════════════════════════════════════
  if (view === 'detail' && detailLead) {
    return (
      <>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <button className="btn btn-ghost btn-sm" onClick={backToKanban} style={{ marginBottom: 'var(--space-3)' }}>
            <ArrowLeft size={16} /> Voltar para o funil
          </button>
        </div>

        <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
          {/* Header */}
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div className="avatar avatar-lg">{detailLead.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}</div>
              <div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--gray-900)' }}>{detailLead.name}</h2>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>Lead desde {new Date(detailLead.createdAt).toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Contact info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
              {detailLead.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}><Phone size={14} style={{ color: 'var(--gray-400)' }} />{detailLead.phone}</div>}
              {detailLead.email && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}><Mail size={14} style={{ color: 'var(--gray-400)' }} />{detailLead.email}</div>}
              {detailLead.instagram && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}><Instagram size={14} style={{ color: 'var(--gray-400)' }} />{detailLead.instagram}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>{SOURCE_ICON[detailLead.source]} Origem: {detailLead.source}</div>
            </div>

            {/* Interest */}
            <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '10px', color: 'var(--gray-400)', marginBottom: 4 }}>INTERESSE PRINCIPAL</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{detailLead.interest || '—'}</div>
              {detailLead.value > 0 && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--success-600)', fontWeight: 'var(--font-semibold)', marginTop: 4 }}>Valor estimado: R$ {detailLead.value.toLocaleString('pt-BR')}</div>}
            </div>

            {/* Notes */}
            {detailLead.notes && (
              <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '10px', color: 'var(--gray-400)', marginBottom: 4 }}>NOTAS</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>{detailLead.notes}</div>
              </div>
            )}

            {/* Stage selector */}
            <div>
              <label style={{ fontSize: '10px', color: 'var(--gray-400)', display: 'block', marginBottom: 4 }}>MOVER PARA ETAPA</label>
              <select className="input" value={detailLead.status} onChange={(e) => {
                const newStage = e.target.value;
                setLeads((prev) => prev.map((l) => l.id === detailLead.id ? { ...l, status: newStage } : l));
                setDetailLead({ ...detailLead, status: newStage });
                updateStage.mutate({ id: detailLead.id, stage: newStage });
              }}>
                {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
              <button className="btn btn-secondary" onClick={backToKanban}>Voltar ao Funil</button>
              <button className="btn btn-primary" onClick={() => {
                convertLead.mutate(detailLead.id);
                backToKanban();
              }}>
                <User size={16} /> Converter em Paciente <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═════════════════════════════════════════════════════════
  // VIEW: Kanban (default)
  // ═════════════════════════════════════════════════════════
  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Kanban size={24} style={{ color: 'var(--primary-500)' }} /> CRM / Funil de Vendas
          </h1>
          <p className="page-subtitle">Acompanhe leads do primeiro contato até a fidelização</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={18} /> Novo Lead
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Total de Leads', value: total, color: 'var(--primary-600)', icon: Users },
          { label: 'Pipeline (R$)', value: `R$ ${pipeline.toLocaleString('pt-BR')}`, color: 'var(--warning-600)', icon: DollarSign },
          { label: 'Fechamentos', value: won, color: 'var(--success-600)', icon: CheckCircle },
          { label: 'Taxa de Conversão', value: `${convRate}%`, color: 'var(--accent-600)', icon: TrendingUp },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="stat-card" style={{ animation: `fadeInUp 0.3s ease backwards ${i * 60}ms` }}>
              <div className="stat-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <div className="stat-title">{kpi.label}</div>
                  <Icon size={18} style={{ color: kpi.color, opacity: 0.6 }} />
                </div>
                <div className="stat-value" style={{ color: kpi.color }}>{kpi.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', paddingBottom: 'var(--space-4)', minHeight: 480 }}>
        {STAGES.map((stage) => {
          const colLeads = leads.filter((l) => l.status === stage.id);
          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
              style={{
                minWidth: 220, maxWidth: 220, flexShrink: 0,
                background: 'var(--gray-50)', borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-3)', border: '2px dashed transparent',
                transition: 'border-color 0.15s ease',
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--gray-700)' }}>{stage.label}</span>
                </div>
                <span style={{ fontSize: '10px', background: 'var(--gray-200)', borderRadius: 99, padding: '1px 7px', color: 'var(--gray-600)', fontWeight: 'var(--font-semibold)' }}>
                  {colLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {colLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                    onClick={() => openDetail(lead)}
                    style={{
                      background: 'white', borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-3)', cursor: 'grab',
                      boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)',
                      transition: 'box-shadow 0.15s ease', animation: 'fadeInUp 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      <div className="avatar avatar-sm" style={{ fontSize: '9px', flexShrink: 0 }}>
                        {lead.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--gray-900)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.name}
                      </div>
                    </div>
                    {lead.interest && (
                      <div style={{ fontSize: '10px', color: 'var(--gray-500)', marginBottom: 'var(--space-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        💆 {lead.interest}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '10px', color: 'var(--gray-400)' }}>
                        {SOURCE_ICON[lead.source]}
                        {lead.source.charAt(0) + lead.source.slice(1).toLowerCase()}
                      </div>
                      {lead.value > 0 && (
                        <span style={{ fontSize: '10px', fontWeight: 'var(--font-semibold)', color: 'var(--success-700)' }}>
                          R$ {lead.value.toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {colLeads.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-3)', color: 'var(--gray-300)', fontSize: '10px' }}>
                    Arraste um card aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
