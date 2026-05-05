export interface ProcedurePrice {
  id: string;
  code: string;
  name: string;
  price: number;
  createdAt: string;
  createdBy: string;
  status: 'ATIVO' | 'INATIVO';
}

export const INITIAL_PROCEDURE_PRICES: ProcedurePrice[] = [
  { id: 'pp1', code: 'TOX-001', name: 'Toxina Botulínica - Frontal', price: 500, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp2', code: 'TOX-002', name: 'Toxina Botulínica - Glabela', price: 500, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp3', code: 'TOX-003', name: 'Toxina Botulínica - Periorbicular', price: 450, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp4', code: 'TOX-004', name: 'Toxina Botulínica - Masseter', price: 600, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp5', code: 'PRE-001', name: 'Preenchimento - Lábios', price: 1200, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp6', code: 'PRE-002', name: 'Preenchimento - Sulco Nasogeniano', price: 1400, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp7', code: 'PRE-003', name: 'Preenchimento - Malar', price: 1500, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp8', code: 'PRE-004', name: 'Preenchimento - Mandíbula', price: 1800, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp9', code: 'PRE-005', name: 'Preenchimento - Mento (queixo)', price: 1300, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp10', code: 'BIO-001', name: 'Bioestimulador de Colágeno', price: 2500, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp11', code: 'FIO-001', name: 'Fios de PDO', price: 3000, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp12', code: 'EST-001', name: 'Limpeza de Pele', price: 250, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp13', code: 'EST-002', name: 'Peeling Químico', price: 500, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp14', code: 'EST-003', name: 'Microagulhamento', price: 400, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp15', code: 'ODO-001', name: 'Clareamento Dental', price: 800, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp16', code: 'ODO-002', name: 'Restauração Dentária', price: 350, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp17', code: 'ODO-003', name: 'Exodontia (extração)', price: 300, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
  { id: 'pp18', code: 'ODO-004', name: 'Profilaxia (limpeza)', price: 200, createdAt: '2026-04-01', createdBy: 'Admin', status: 'ATIVO' },
];

export interface Campaign {
  id: string;
  name: string;
  discountType: 'PERCENTUAL' | 'FIXO';
  discountValue: number;
  startDate: string;
  endDate: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'AMBOS';
  active: boolean;
}

export const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Semana da Beleza', discountType: 'PERCENTUAL', discountValue: 15, startDate: '2026-04-15', endDate: '2026-04-30', channel: 'WHATSAPP', active: true },
  { id: 'c2', name: 'Mês do Sorriso', discountType: 'FIXO', discountValue: 100, startDate: '2026-05-01', endDate: '2026-05-31', channel: 'AMBOS', active: false },
];
