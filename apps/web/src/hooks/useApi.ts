import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// =============================================
// Auth Hooks
// =============================================

export function useLogin() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post('/auth/login', data);
      return res.data;
    },
  });
}

// =============================================
// Patients Hooks
// =============================================

interface PatientsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export function usePatients(params: PatientsParams = {}) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: async () => {
      const res = await api.get('/patients', { params });
      return res.data;
    },
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: async () => {
      const res = await api.get(`/patients/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function usePatientStats() {
  return useQuery({
    queryKey: ['patients', 'stats'],
    queryFn: async () => {
      const res = await api.get('/patients/stats');
      return res.data;
    },
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/patients', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useUpdatePatient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.patch(`/patients/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

// =============================================
// Schedule Hooks
// =============================================

interface ScheduleParams {
  date?: string;
  professionalId?: string;
  patientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export function useSchedules(params: ScheduleParams = {}) {
  return useQuery({
    queryKey: ['schedules', params],
    queryFn: async () => {
      const res = await api.get('/schedules', { params });
      return res.data;
    },
  });
}

export function useSchedulesToday() {
  return useQuery({
    queryKey: ['schedules', 'today'],
    queryFn: async () => {
      const res = await api.get('/schedules/today');
      return res.data;
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['schedules', 'dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/schedules/dashboard-stats');
      return res.data;
    },
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/schedules', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

export function useUpdateScheduleStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { status: string; reason?: string }) => {
      const res = await api.patch(`/schedules/${id}/status`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

// =============================================
// Medical Records Hooks
// =============================================

export function useMedicalRecords(patientId: string) {
  return useQuery({
    queryKey: ['medical-records', patientId],
    queryFn: async () => {
      const res = await api.get('/medical-records', { params: { patientId } });
      return res.data;
    },
    enabled: !!patientId,
  });
}

export function useCreateMedicalRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/medical-records', data);
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['medical-records', vars.patientId as string] });
    },
  });
}

// =============================================
// Anamnesis Hooks
// =============================================

export function useAnamneses(patientId: string) {
  return useQuery({
    queryKey: ['anamneses', patientId],
    queryFn: async () => {
      const res = await api.get('/anamneses', { params: { patientId } });
      return res.data;
    },
    enabled: !!patientId,
  });
}

export function useCreateAnamnesis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/anamneses', data);
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['anamneses', vars.patientId as string] });
    },
  });
}

// =============================================
// HOF Records Hooks
// =============================================

export function useHofRecords(patientId: string) {
  return useQuery({
    queryKey: ['hof-records', patientId],
    queryFn: async () => {
      const res = await api.get('/hof-records', { params: { patientId } });
      return res.data;
    },
    enabled: !!patientId,
  });
}

export function useCreateHofRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/hof-records', data);
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['hof-records', vars.patientId as string] });
    },
  });
}

// =============================================
// Photos Hooks
// =============================================

export function usePatientPhotos(patientId: string) {
  return useQuery({
    queryKey: ['photos', patientId],
    queryFn: async () => {
      const res = await api.get(`/photos/patient/${patientId}`);
      return res.data;
    },
    enabled: !!patientId,
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}

// =============================================
// Finance Hooks
// =============================================

interface FinanceParams {
  patientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function useFinances(params: FinanceParams = {}) {
  return useQuery({
    queryKey: ['finances', params],
    queryFn: async () => {
      const res = await api.get('/finances', { params });
      return res.data;
    },
  });
}

export function useFinanceSummary() {
  return useQuery({
    queryKey: ['finances', 'summary'],
    queryFn: async () => {
      const res = await api.get('/finances/summary');
      return res.data;
    },
  });
}

export function useCreateFinance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/finances', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] });
    },
  });
}

export function useUpdateFinanceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status: string; paidAt?: string; paymentMethod?: string }) => {
      const res = await api.patch(`/finances/${id}/status`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] });
    },
  });
}

// =============================================
// Audit Hooks
// =============================================

interface AuditParams {
  page?: number;
  limit?: number;
  userId?: string;
  entityType?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export function useAuditLogs(params: AuditParams = {}) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: async () => {
      const res = await api.get('/audit', { params });
      return res.data;
    },
  });
}

// =============================================
// Settings Hooks
// =============================================

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.put('/settings', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

// =============================================
// Stock Hooks (Controle de Estoque)
// =============================================

interface StockParams {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useStockProducts(params: StockParams = {}) {
  return useQuery({
    queryKey: ['stock-products', params],
    queryFn: async () => {
      const res = await api.get('/stock/products', { params });
      return res.data;
    },
  });
}

export function useStockProduct(id: string) {
  return useQuery({
    queryKey: ['stock-products', id],
    queryFn: async () => {
      const res = await api.get(`/stock/products/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useStockAlerts() {
  return useQuery({
    queryKey: ['stock-alerts'],
    queryFn: async () => {
      const res = await api.get('/stock/alerts');
      return res.data;
    },
  });
}

export function useCreateStockProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/stock/products', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-products'] });
    },
  });
}

export function useCreateStockBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/stock/batches', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    },
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/stock/movements', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    },
  });
}

// =============================================
// Medications Hooks
// =============================================

interface MedicationParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export function useMedications(params: MedicationParams = {}) {
  return useQuery({
    queryKey: ['medications', params],
    queryFn: async () => {
      const res = await api.get('/medications', { params });
      return res.data;
    },
  });
}

export function useCreateMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/medications', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });
}

// =============================================
// CRM / Leads Hooks
// =============================================

interface LeadParams {
  stage?: string;
  source?: string;
  assignedTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useLeads(params: LeadParams = {}) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: async () => {
      const res = await api.get('/leads', { params });
      return res.data;
    },
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: async () => {
      const res = await api.get(`/leads/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/leads', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLeadStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await api.patch(`/leads/${id}/stage`, { stage });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useConvertLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/leads/${id}/convert`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

// =============================================
// Documents Hooks
// =============================================

export function useDocuments(params: { patientId?: string; type?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: async () => {
      const res = await api.get('/documents', { params });
      return res.data;
    },
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/documents', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
