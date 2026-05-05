// Shared patient domain types — consumed by all tab components

export interface Patient {
  id: string;
  name: string;
  cpf?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  status: 'ATIVO' | 'INATIVO' | 'ARQUIVADO';
  phoneMain?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  healthInsurance?: string | null;
  origin?: string | null;
  profession?: string | null;
  notes?: string | null;
  createdAt: string;
  _count?: {
    medicalRecords?: number;
    photos?: number;
    documents?: number;
    finances?: number;
    anamneses?: number;
  };
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  dateTime: string;
  procedures?: string;
  complaint?: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  notes?: string;
  nextReturn?: string;
  isDraft: boolean;
  createdAt: string;
}

export interface Photo {
  id: string;
  patientId: string;
  url?: string;
  title?: string;
  description?: string;
  category: 'ANTES' | 'DURANTE' | 'DEPOIS' | 'RAIO_X' | 'TOMOGRAFIA' | 'OUTRO';
  createdAt: string;
}

export interface Document {
  id: string;
  patientId: string;
  type: string;
  title: string;
  content: string;
  status: 'RASCUNHO' | 'ASSINADO';
  createdAt: string;
}

export interface Anamnesis {
  id: string;
  patientId: string;
  status: 'RASCUNHO' | 'PREENCHIDA';
  data?: Record<string, unknown>;
  content?: Record<string, unknown>;
  filledAt?: string;
  createdAt: string;
}

export interface Finance {
  id: string;
  patientId: string;
  description: string;
  amount: number;
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO';
  type?: 'RECEBIMENTO' | 'DESPESA';
  paymentMethod?: string;
  dueDate?: string;
  paidAt?: string;
  totalInstallments?: number;
  installment?: number;
  notes?: string;
  createdAt: string;
}

export interface Schedule {
  id: string;
  patientId: string;
  status: string;
  startAt: string;
  endAt?: string;
  notes?: string;
  isBlock?: boolean;
  procedure?: { id: string; name: string };
  room?: { id: string; name: string };
  professional?: { id: string; name: string };
  patient?: { id: string; name: string };
}

// Props pattern for all tab components
export interface TabComponentProps {
  patientId: string;
  patientName?: string;
}

// Photo category metadata
export const PHOTO_CATEGORIES = {
  ANTES:      { label: 'Antes',       color: '#2563eb' },
  DURANTE:    { label: 'Durante',     color: '#d97706' },
  DEPOIS:     { label: 'Depois',      color: '#16a34a' },
  RAIO_X:     { label: 'Raio-X',     color: '#7c3aed' },
  TOMOGRAFIA: { label: 'Tomografia', color: '#0891b2' },
  OUTRO:      { label: 'Outro',      color: '#64748b' },
} as const;

export type PhotoCategory = keyof typeof PHOTO_CATEGORIES;

// Schedule status badge mapping
export const SCHEDULE_STATUS_BADGE: Record<string, string> = {
  AGENDADO:   'badge-primary',
  CONFIRMADO: 'badge-success',
  CONCLUIDO:  'badge-success',
  CANCELADO:  'badge-error',
  BLOQUEIO:   'badge-neutral',
  FALTOU:     'badge-warning',
};

export const GENDER_LABEL: Record<string, string> = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
  OUTRO: 'Outro',
  NAO_INFORMADO: 'Não informado',
};

export const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'PIX',
  CARTAO_CREDITO: 'Cartão Crédito',
  CARTAO_DEBITO: 'Cartão Débito',
  DINHEIRO: 'Dinheiro',
  BOLETO: 'Boleto',
  TRANSFERENCIA: 'Transferência',
};
