// =============================================
// Role & Permission Constants
// =============================================

export const ROLES = {
  ADMIN: 'ADMIN',
  RECEPCAO: 'RECEPCAO',
  DENTISTA: 'DENTISTA',
  HOF: 'HOF',
  FINANCEIRO: 'FINANCEIRO',
  MARKETING: 'MARKETING',
  PACIENTE: 'PACIENTE',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleName, string> = {
  ADMIN: 'Administrador',
  RECEPCAO: 'Recepção',
  DENTISTA: 'Dentista',
  HOF: 'Harmonização Orofacial',
  FINANCEIRO: 'Financeiro',
  MARKETING: 'Marketing',
  PACIENTE: 'Paciente',
};

// =============================================
// Schedule Status
// =============================================

export const SCHEDULE_STATUS = {
  AGENDADO: 'AGENDADO',
  CONFIRMADO: 'CONFIRMADO',
  EM_ATENDIMENTO: 'EM_ATENDIMENTO',
  CONCLUIDO: 'CONCLUIDO',
  CANCELADO: 'CANCELADO',
  FALTOU: 'FALTOU',
  BLOQUEIO: 'BLOQUEIO',
} as const;

export type ScheduleStatus = (typeof SCHEDULE_STATUS)[keyof typeof SCHEDULE_STATUS];

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  AGENDADO: 'Agendado',
  CONFIRMADO: 'Confirmado',
  EM_ATENDIMENTO: 'Em Atendimento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
  FALTOU: 'Faltou',
  BLOQUEIO: 'Bloqueio',
};

export const SCHEDULE_STATUS_COLORS: Record<ScheduleStatus, string> = {
  AGENDADO: '#FFB020',
  CONFIRMADO: '#1FA2A6',
  EM_ATENDIMENTO: '#0B5B6F',
  CONCLUIDO: '#1A898D',
  CANCELADO: '#8E99A8',
  FALTOU: '#E03E3E',
  BLOQUEIO: '#B8C0CC',
};

// =============================================
// Photo Categories
// =============================================

export const PHOTO_CATEGORIES = {
  ANTES: 'ANTES',
  DURANTE: 'DURANTE',
  DEPOIS: 'DEPOIS',
  EXAME: 'EXAME',
  OUTRO: 'OUTRO',
} as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[keyof typeof PHOTO_CATEGORIES];

// =============================================
// Finance Status
// =============================================

export const FINANCE_STATUS = {
  PENDENTE: 'PENDENTE',
  PAGO: 'PAGO',
  ATRASADO: 'ATRASADO',
  CANCELADO: 'CANCELADO',
  ESTORNADO: 'ESTORNADO',
} as const;

export type FinanceStatus = (typeof FINANCE_STATUS)[keyof typeof FINANCE_STATUS];

export const PAYMENT_METHODS = {
  DINHEIRO: 'DINHEIRO',
  CARTAO_CREDITO: 'CARTAO_CREDITO',
  CARTAO_DEBITO: 'CARTAO_DEBITO',
  PIX: 'PIX',
  TRANSFERENCIA: 'TRANSFERENCIA',
  BOLETO: 'BOLETO',
  CONVENIO: 'CONVENIO',
  OUTRO: 'OUTRO',
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO: 'Cartão de Débito',
  PIX: 'PIX',
  TRANSFERENCIA: 'Transferência',
  BOLETO: 'Boleto',
  CONVENIO: 'Convênio',
  OUTRO: 'Outro',
};

// =============================================
// Brazilian States
// =============================================

export const BR_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;
