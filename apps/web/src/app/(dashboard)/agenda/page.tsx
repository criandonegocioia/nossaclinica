'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  MapPin,
  X,
  CheckCircle,
  AlertCircle,
  Save,
  MessageCircle,
  Search,
  Mail,
} from 'lucide-react';
import { usePatients, useSchedules } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
// ── Constants ────────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);
const ROOMS = ['Sala 1', 'Sala 2', 'Sala 3', 'Sala HOF'];

const PROFESSIONALS = [
  { id: '1', name: 'Dra. Ana Costa', specialty: 'HOF / Estética' },
  { id: '2', name: 'Dr. João Silva', specialty: 'Odontologia Geral' },
  { id: '3', name: 'Dra. Luísa Santos', specialty: 'Ortodontia' },
];

const PROCEDURES = [
  'Consulta de Avaliação', 'Profilaxia', 'Restauração', 'Endodontia',
  'Extração', 'Clareamento', 'Toxina Botulínica', 'Ácido Hialurônico',
  'Bioestimulador', 'Fios de PDO', 'Retorno', 'Ortodontia - Manutenção',
  'Cirurgia', 'Implante', 'Outro',
];

const DURATIONS = [
  { value: 15, label: '15 min' }, { value: 30, label: '30 min' },
  { value: 45, label: '45 min' }, { value: 60, label: '1h' },
  { value: 90, label: '1h30' }, { value: 120, label: '2h' },
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

interface Appointment {
  id: string;
  patientName: string;
  procedure: string;
  date: string;
  time: string;
  duration: number;
  room: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  professional: string;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  SCHEDULED: { bg: 'var(--primary-50)', border: 'var(--primary-300)', text: 'var(--primary-700)' },
  CONFIRMED: { bg: 'var(--success-50)', border: 'var(--success-300)', text: 'var(--success-700)' },
  IN_PROGRESS: { bg: 'var(--warning-50)', border: 'var(--warning-300)', text: 'var(--warning-700)' },
  COMPLETED: { bg: 'var(--gray-50)', border: 'var(--gray-200)', text: 'var(--gray-500)' },
  CANCELLED: { bg: 'var(--error-50)', border: 'var(--error-200)', text: 'var(--error-500)' },
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado', CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em atendimento', COMPLETED: 'Finalizado', CANCELLED: 'Cancelado',
};

const MOCK_DATE = new Date().toISOString().split('T')[0];
const MOCK_APPOINTMENTS: Appointment[] = [];

// ── Helpers ──────────────────────────────────────────────────────────────────
function isCpfQuery(q: string) {
  const digits = q.replace(/\D/g, '');
  return digits.length >= 5 && /^[\d.\-]+$/.test(q);
}

function Field({ label, children, span, required }: { label: string; children: React.ReactNode; span?: boolean; required?: boolean }) {
  return (
    <div className="input-group" style={span ? { gridColumn: '1 / -1' } : undefined}>
      <label className={`input-label${required ? ' required' : ''}`}>{label}</label>
      {children}
    </div>
  );
}

// ── New Appointment (inline) ────────────────────────────────────────────────
function NewAppointmentInline({ defaultDate, defaultTime, defaultRoom, params, onDone }: { defaultDate: string; defaultTime?: string; defaultRoom?: string; params?: Appointment; onDone: (result?: Appointment) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(
    params ? { id: 'edit-mock', name: params.patientName } : null
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<'name' | 'cpf'>('name');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    procedure: params?.procedure || 'Consulta de Avaliação',
    professional: params ? (PROFESSIONALS.find(p => p.name.includes(params.professional))?.id || PROFESSIONALS[0].id) : PROFESSIONALS[0].id,
    date: params?.date || defaultDate,
    time: params?.time || defaultTime || '09:00',
    duration: params?.duration || 60,
    room: params?.room || defaultRoom || 'Sala 1',
    notes: '',
    sendWhatsApp: true,
    sendEmail: false,
  });

  const update = (field: string, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleQueryChange = useCallback((val: string) => {
    setSearchQuery(val);
    setDropdownOpen(val.length >= 3);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (isCpfQuery(val) && searchMode === 'cpf') {
      setDebouncedQuery(val);
    } else if (val.length >= 3) {
      debounceRef.current = setTimeout(() => setDebouncedQuery(val), 400);
    } else {
      setDebouncedQuery('');
    }
  }, [searchMode]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const { data: patientsData, isLoading: isSearching } = usePatients({ search: debouncedQuery || undefined, limit: 8 });
  const searchResults: { id: string; name: string; cpf?: string }[] = (patientsData as { data?: { id: string; name: string; cpf?: string }[] })?.data ?? [];

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSaving(false);
    setSaved(true);
    
    const result: Appointment = {
      id: params ? params.id : Math.random().toString(36).substring(7),
      patientName: selectedPatient?.name || '',
      procedure: form.procedure,
      date: form.date,
      time: form.time,
      duration: form.duration,
      room: form.room,
      status: params ? params.status : 'SCHEDULED',
      professional: PROFESSIONALS.find(p => p.id === form.professional)?.name || form.professional,
    };
    
    setTimeout(() => onDone(result), 1800);
  };

  if (saved) {
    return (
      <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
        <div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <CheckCircle size={48} style={{ color: 'var(--success-500)', margin: '0 auto var(--space-4)' }} />
          <p style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Agendamento salvo com sucesso!</p>
          {form.sendWhatsApp && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--success-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
              <MessageCircle size={14} /> Lembrete WhatsApp será enviado 24h antes
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onDone()}><ChevronLeft size={18} /></button>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Calendar size={18} style={{ color: 'var(--primary-500)' }} /> {params ? 'Reagendar Procedimento' : 'Novo Agendamento'}
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
          {/* Patient search */}
          <div className="input-group">
            <label className="input-label required" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><User size={12} /> Paciente</span>
              {!selectedPatient && (
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  {(['name', 'cpf'] as const).map((mode) => (
                    <button key={mode} className={`btn btn-sm ${searchMode === mode ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={(e) => { e.preventDefault(); setSearchMode(mode); setSearchQuery(''); setDebouncedQuery(''); }}
                      style={{ fontSize: '10px', padding: '2px 6px', height: 20, minHeight: 20 }}>
                      {mode === 'name' ? '👤 Nome' : '📋 CPF'}
                    </button>
                  ))}
                </div>
              )}
            </label>
            {selectedPatient ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)',
                background: 'var(--primary-50)', border: '1px solid var(--primary-200)',
              }}>
                <div className="avatar" style={{ width: 28, height: 28, fontSize: '10px' }}>
                  {selectedPatient.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 'var(--text-sm)' }}>{selectedPatient.name}</span>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setSelectedPatient(null); setSearchQuery(''); }}><X size={14} /></button>
              </div>
            ) : (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                  <input className="input" value={searchQuery}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder={searchMode === 'cpf' ? 'ex: 000.000.000-00' : 'Digite o nome do paciente...'}
                    style={{ paddingLeft: 32 }} />
                </div>
                {dropdownOpen && debouncedQuery.length >= 3 && (
                  <div style={{
                    position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 50,
                    background: 'white', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)', maxHeight: 200, overflow: 'auto', marginTop: 4,
                  }}>
                    {isSearching ? (
                      <div style={{ padding: 'var(--space-3)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
                        <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, marginRight: 8 }} />Buscando...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div style={{ padding: 'var(--space-3)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
                        Nenhum paciente encontrado
                      </div>
                    ) : searchResults.map((p) => (
                      <button key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                        width: '100%', padding: 'var(--space-2) var(--space-3)', border: 'none',
                        background: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', textAlign: 'left',
                      }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-50)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        onClick={() => {
                          setSelectedPatient({ id: p.id, name: p.name });
                          setDropdownOpen(false);
                          setSearchQuery('');
                        }}>
                        <div className="avatar" style={{ width: 24, height: 24, fontSize: '9px' }}>
                          {p.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.name}</div>
                          {p.cpf && <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{p.cpf}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Field label="Procedimento" required>
            <select className="input" value={form.procedure} onChange={(e) => update('procedure', e.target.value)}>
              {PROCEDURES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>

          {/* Professional */}
          <Field label="Profissional" required>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {PROFESSIONALS.map((prof) => (
                <button key={prof.id}
                  className={`btn btn-sm ${form.professional === prof.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => update('professional', prof.id)}
                  style={{ flex: 1, flexDirection: 'column', padding: 'var(--space-2)', gap: 2, fontSize: '11px' }}>
                  <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{prof.name}</span>
                  <span style={{ fontSize: '9px', opacity: 0.7 }}>{prof.specialty}</span>
                </button>
              ))}
            </div>
          </Field>

          {/* Date + Time + Duration row */}
          <div style={{ display: 'contents' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', gridColumn: '1 / -1' }}>
              <Field label="Data" required>
                <input className="input" type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
              </Field>
              <Field label="Horário" required>
                <select className="input" value={form.time} onChange={(e) => update('time', e.target.value)}>
                  {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Duração">
                <select className="input" value={form.duration} onChange={(e) => update('duration', parseInt(e.target.value))}>
                  {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Room chips */}
          <Field label="Sala" required>
            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
              {ROOMS.map((room) => (
                <button key={room}
                  className={`btn btn-sm ${form.room === room ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => update('room', room)}>{room}</button>
              ))}
            </div>
          </Field>

          <div /> {/* spacer */}

          <Field label="Observações" span>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => update('notes', e.target.value)}
              placeholder="Instruções para o paciente ou equipe..." style={{ resize: 'vertical' }} />
          </Field>

          {/* Reminders */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--gray-500)', marginBottom: 'var(--space-2)' }}>
              Lembretes automáticos
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                <input type="checkbox" checked={form.sendWhatsApp} onChange={(e) => update('sendWhatsApp', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--primary-500)' }} />
                <MessageCircle size={14} style={{ color: 'var(--success-500)' }} /> WhatsApp (24h antes)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                <input type="checkbox" checked={form.sendEmail} onChange={(e) => update('sendEmail', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--primary-500)' }} />
                <Mail size={14} style={{ color: 'var(--primary-500)' }} /> E-mail (48h antes)
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--gray-100)' }}>
          <button className="btn btn-secondary" onClick={() => onDone()}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !selectedPatient}>
            {saving ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : <><Save size={14} /> Salvar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Appointment Detail (inline) ─────────────────────────────────────────────
function AppointmentDetailInline({ appt, onBack, onConfirm, onReschedule, onCancel }: { 
  appt: Appointment; 
  onBack: () => void;
  onConfirm: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="card" style={{ animation: 'fadeInUp 0.25s ease' }}>
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onBack}><ChevronLeft size={18} /></button>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Detalhes do Agendamento</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <div className="avatar" style={{ width: 48, height: 48, fontSize: 'var(--text-base)' }}>
            {appt.patientName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{appt.patientName}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>{appt.procedure}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Horário</div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={14} /> {appt.time} · {appt.duration}min
            </div>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Sala</div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={14} /> {appt.room}
            </div>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Profissional</div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <User size={14} /> {appt.professional}
            </div>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'var(--gray-25)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 2 }}>Status</div>
            <span className={`badge badge-dot ${
              appt.status === 'CONFIRMED' ? 'badge-success' :
              appt.status === 'IN_PROGRESS' ? 'badge-warning' :
              appt.status === 'CANCELLED' ? 'badge-error' : 'badge-primary'
            }`}>
              {STATUS_LABELS[appt.status]}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={onConfirm} disabled={appt.status === 'CONFIRMED' || appt.status === 'CANCELLED'}>
            <CheckCircle size={14} /> Confirmar
          </button>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={onReschedule} disabled={appt.status === 'CANCELLED'}>
            Reagendar
          </button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error-500)' }} onClick={onCancel} disabled={appt.status === 'CANCELLED'}>
            <AlertCircle size={14} /> Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'new' | 'detail'>('calendar');
  const [calendarMode, setCalendarMode] = useState<'day' | 'week'>('day');
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [newApptDefaults, setNewApptDefaults] = useState<{ time: string; room?: string; date?: string } | null>(null);

  const queryClient = useQueryClient();
  const { data: dbSchedules, isLoading } = useSchedules();

  const appointments: Appointment[] = (dbSchedules || []).map((s: any) => {
    const d = new Date(s.startAt);
    const duration = Math.round((new Date(s.endAt).getTime() - d.getTime()) / 60000);
    const localD = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    return {
      id: s.id,
      patientName: s.patient?.name || 'Bloqueio',
      procedure: s.procedure?.name || s.notes || '—',
      date: localD.toISOString().split('T')[0],
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      duration,
      room: s.room?.name || 'Sala 1',
      status: s.status === 'AGENDADO' ? 'SCHEDULED' : s.status === 'CONFIRMADO' ? 'CONFIRMED' : s.status === 'EM_ATENDIMENTO' ? 'IN_PROGRESS' : s.status === 'CONCLUIDO' ? 'COMPLETED' : 'CANCELLED',
      professional: s.professional?.name || '—',
    };
  });

  const dateStr = currentDate.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const currentDayStr = new Date(currentDate.getTime() - (currentDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  
  const getWeekDates = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay() === 0 ? 7 : d.getDay(); 
    const start = new Date(d);
    start.setDate(d.getDate() - day + 1); 
    return Array.from({ length: 5 }, (_, i) => { 
      const nd = new Date(start);
      nd.setDate(start.getDate() + i);
      return nd;
    });
  };

  const weekDays = getWeekDates(currentDate);
  const weekDatesStrs = weekDays.map((d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]);

  const activeAppointments = appointments.filter((a) => {
    if (calendarMode === 'day') return a.date === currentDayStr;
    return weekDatesStrs.includes(a.date);
  });

  const navigateDay = (delta: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (calendarMode === 'week' ? delta * 7 : delta));
    setCurrentDate(d);
  };

  const getAppointmentStyle = (appt: Appointment) => {
    const [h, m] = appt.time.split(':').map(Number);
    const startMinutes = (h - 8) * 60 + m;
    const top = (startMinutes / 60) * 72;
    const height = Math.max((appt.duration / 60) * 72 - 4, 28);
    const colors = STATUS_COLORS[appt.status];
    return { top, height, ...colors };
  };

  const handleViewAppt = (appt: Appointment) => {
    setSelectedAppt(appt);
    setView('detail');
  };

  const handleConfirmAppt = async () => {
    if (!selectedAppt) return;
    try {
      await api.patch(`/schedules/${selectedAppt.id}/status`, { status: 'CONFIRMADO' });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    } catch {}
    setView('calendar');
    setSelectedAppt(null);
  };

  const handleCancelAppt = async () => {
    if (!selectedAppt) return;
    try {
      await api.patch(`/schedules/${selectedAppt.id}/status`, { status: 'CANCELADO' });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    } catch {}
    setView('calendar');
    setSelectedAppt(null);
  };

  const renderColumn = (hour: string, colKey: string, colAppts: Appointment[]) => (
    <div key={`${hour}-${colKey}`} style={{
      borderLeft: '1px solid var(--gray-100)', borderBottom: '1px solid var(--gray-50)',
      position: 'relative', height: 72, cursor: 'pointer'
    }} onClick={(e) => {
      if (e.target === e.currentTarget) {
         setNewApptDefaults({ time: hour, ...(calendarMode === 'day' ? { room: colKey } : { date: colKey, room: 'Sala 1' }) });
         setView('new');
      }
    }}>
      {hour === '08:00' && colAppts.map((appt) => {
        const style = getAppointmentStyle(appt);
        return (
          <div
            key={appt.id}
            onClick={() => handleViewAppt(appt)}
            style={{
              position: 'absolute', top: style.top, left: 2, right: 2,
              height: style.height, background: style.bg, border: `1px solid ${style.border}`,
              borderRadius: 'var(--radius-md)', padding: '4px 8px',
              cursor: 'pointer', overflow: 'hidden', zIndex: 1,
              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: style.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {appt.patientName}
            </div>
            <div style={{ fontSize: '9px', color: style.text, opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {appt.procedure}
            </div>
            {style.height > 50 && (
              <div style={{ fontSize: '9px', color: style.text, opacity: 0.6, marginTop: 2 }}>
                {appt.time} · {appt.duration}min
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Calendar size={28} style={{ color: 'var(--primary-500)' }} />
              Agenda
            </span>
          </h1>
          <p className="page-subtitle" style={{ textTransform: 'capitalize' }}>{dateStr}</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {view === 'calendar' && (
            <>
              <div style={{ display: 'flex', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {(['day', 'week'] as const).map((v) => (
                  <button key={v}
                    className={`btn btn-sm ${calendarMode === v ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setCalendarMode(v)}
                    style={{ borderRadius: 0 }}>
                    {v === 'day' ? 'Dia' : 'Semana'}
                  </button>
                ))}
              </div>
              <button className="btn btn-primary" onClick={() => { setSelectedAppt(null); setNewApptDefaults(null); setView('new'); }}>
                <Plus size={18} /> Novo Agendamento
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── VIEW: New / Edit Appointment ── */}
      {view === 'new' && (
        <NewAppointmentInline
          defaultDate={newApptDefaults?.date || currentDate.toISOString().split('T')[0]}
          defaultTime={newApptDefaults?.time}
          defaultRoom={newApptDefaults?.room}
          params={selectedAppt || undefined}
          onDone={(updatedAppt) => {
            if (updatedAppt) {
              queryClient.invalidateQueries({ queryKey: ['schedules'] });
            }
            setView('calendar');
            setSelectedAppt(null);
          }}
        />
      )}

      {/* ── VIEW: Appointment Detail ── */}
      {view === 'detail' && selectedAppt && (
        <AppointmentDetailInline
          appt={selectedAppt}
          onBack={() => { setSelectedAppt(null); setView('calendar'); }}
          onConfirm={handleConfirmAppt}
          onReschedule={() => setView('new')}
          onCancel={handleCancelAppt}
        />
      )}

      {/* ── VIEW: Calendar Grid ── */}
      {view === 'calendar' && (
        <>
          {/* Date Navigation */}
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="card-body" style={{ padding: 'var(--space-3) var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigateDay(-1)}>
                    <ChevronLeft size={18} />
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setCurrentDate(new Date())}>
                    Hoje
                  </button>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigateDay(1)}>
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Status Legend */}
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  {Object.entries(STATUS_LABELS).slice(0, 4).map(([key, label]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_COLORS[key].border }} />
                      {label}
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                  {activeAppointments.filter((a) => a.status !== 'CANCELLED').length} agendamentos
                </div>
              </div>
            </div>
          </div>

          {/* Day View Grid */}
          <div className="card">
            <div className="card-body" style={{ padding: 0, overflow: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: `60px repeat(${calendarMode === 'day' ? ROOMS.length : weekDays.length}, 1fr)`, minWidth: 700 }}>
                {/* Header */}
                <div style={{ borderBottom: '1px solid var(--gray-100)', padding: 'var(--space-3)', background: 'var(--gray-25)' }} />
                {calendarMode === 'day' ? ROOMS.map((room) => (
                  <div key={room} style={{
                    borderBottom: '1px solid var(--gray-100)', borderLeft: '1px solid var(--gray-100)',
                    padding: 'var(--space-3)', textAlign: 'center',
                    fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--gray-600)',
                    background: 'var(--gray-25)',
                  }}>
                    <MapPin size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                    {room}
                  </div>
                )) : weekDays.map((d) => (
                  <div key={d.toISOString()} style={{
                    borderBottom: '1px solid var(--gray-100)', borderLeft: '1px solid var(--gray-100)',
                    padding: 'var(--space-3)', textAlign: 'center',
                    fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--gray-600)',
                    background: 'var(--gray-25)',
                  }}>
                    {d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                  </div>
                ))}

                {/* Time Grid */}
                {HOURS.map((hour) => (
                  <div key={hour} style={{ display: 'contents' }}>
                    <div style={{
                      padding: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--gray-400)',
                      textAlign: 'right', paddingRight: 'var(--space-3)', borderBottom: '1px solid var(--gray-50)',
                      height: 72,
                    }}>
                      {hour}
                    </div>
                    {calendarMode === 'day' ? ROOMS.map((room) => {
                      const colAppts = activeAppointments.filter((a) => a.room === room);
                      return renderColumn(hour, room, colAppts);
                    }) : weekDays.map((d) => {
                      const dateStr = d.toISOString().split('T')[0];
                      const colAppts = activeAppointments.filter((a) => a.date === dateStr);
                      return renderColumn(hour, dateStr, colAppts);
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
