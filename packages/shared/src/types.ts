// =============================================
// Shared TypeScript Types
// =============================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  active: boolean;
}

export interface Patient {
  id: string;
  name: string;
  cpf?: string | null;
  rg?: string | null;
  birthDate?: string | null;
  gender: string;
  maritalStatus: string;
  phoneMain?: string | null;
  phoneSecondary?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  profession?: string | null;
  guardianName?: string | null;
  origin?: string | null;
  healthInsurance?: string | null;
  observations?: string | null;
  avatarUrl?: string | null;
  status: 'ATIVO' | 'INATIVO' | 'ARQUIVADO';
  googleDriveRootId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  patientId?: string | null;
  professionalId: string;
  roomId?: string | null;
  procedureId?: string | null;
  startAt: string;
  endAt: string;
  status: string;
  colorCode?: string | null;
  notes?: string | null;
  isBlock: boolean;
  patient?: Pick<Patient, 'id' | 'name' | 'avatarUrl' | 'phoneMain'> | null;
  professional?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  room?: { id: string; name: string } | null;
  procedure?: { id: string; name: string; colorCode?: string | null } | null;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  professionalId: string;
  dateTime: string;
  complaint?: string | null;
  diagnosis?: string | null;
  treatmentPlan?: string | null;
  procedures?: string | null;
  prescriptions?: string | null;
  orientations?: string | null;
  complications?: string | null;
  professionalSignature?: string | null;
  isDraft: boolean;
  previousVersionId?: string | null;
  createdAt: string;
}

export interface Photo {
  id: string;
  patientId: string;
  category: string;
  fileName: string;
  driveLink?: string | null;
  thumbnailUrl?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'email'> | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
